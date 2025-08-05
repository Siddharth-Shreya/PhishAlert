chrome.runtime.onMessage.addListener(function (message, sendResponse) {
    if (message.action === 'getAuthToken') {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            sendResponse({ token });
        });
        return true;
    }
});

chrome.alarms.create('scheduledEmailFetch', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async function (alarm) {
    if (alarm.name !== 'scheduledEmailFetch') return;
    chrome.runtime.sendMessage({ action: 'fetchStarted' });

    try {
        await handleScanClick();
        chrome.runtime.sendMessage({ action: 'fetchFinished' });
    }
    catch (e) {
        chrome.runtime.sendMessage({ action: 'fetchFailed', error: e.message });
    }
});

async function handleScanClick () {
    const { authToken } = await chrome.storage.local.get('authToken');

    if (!authToken) {
        console.error('No auth token found');
        return;
    }

    const params = { method: 'GET', headers: { 'Authorization': 'Bearer ' + authToken } };
    const messagesResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:anywhere AND -in:spam AND -in:trash AND (newer_than:2d OR is:unread)', params);
    const { messages } = await messagesResponse.json();

    if (!messages) return [];

    return fetchEmails(messages, params);
}

async function fetchEmails (messages, params) {
    const scamEmails = [];
    for (const msg of messages) {
        const msgResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, params);
        const msgData = await msgResponse.json();

        // console.log("Message data")
        // console.log(msgData)

        let subject = '', date = '', body = '', sender = '', receiver = '', urls = 'https://gmail.google.com';

        for (const header of msgData.payload.headers) {
            if (header.name === 'Subject') subject = header.value;
            if (header.name === 'Date') date = header.value;
            if (header.name === 'From') sender = header.value;
            if (header.name === 'To') receiver = header.value;
        }

        body = parseBody(msgData.payload);

        const flaskPayload = { subject, body, sender, receiver, date, urls };
        const flaskResult = await fetch('http://localhost:5000/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(flaskPayload) });
        const flaskData = await flaskResult.json();

        if (flaskData.prediction == 1) {
            scamEmails.push({ subject, date, probability: flaskData.probability, prediction: flaskData.prediction });
        }
    }
    await chrome.storage.local.set({ lastResults: scamEmails });
    return scamEmails;
}

// inspired from https://github.com/abhishekchhibber/Gmail-Api-through-Python/blob/master/gmail_read.py, ChatGPT, and Gemini
function parseBody(payload) {
    let body = '';

    // from https://stackoverflow.com/questions/5234581/base64url-decoding-via-javascript
    function urlSafeB64Decode(str) {
        /*
        - replace + with -, _ with /
        - padding is included in since Base64 requires string to of length multiple of 4
        - decode Base64 string -> original byte sequence -> character -> joins characters
        */
        const base64Encoded = str.replace(/-/g, '+').replace(/_/g, '/');
        const padding = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
        const base64WithPadding = base64Encoded + padding;
        return atob(base64WithPadding)
            .split('')
            .map(char => String.fromCharCode(char.charCodeAt(0)))
            .join('');
    }

    // Added this in place of DOMParser since it's not available for the service worker
    function parser(html) {
      return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }

    /*
    - Mimetype: classifies file formats / content formats
    - .trim(): remove whitespaces from beginning and end of string
    - parser.parseFromString: parses html body
    */
    if (payload.parts) {
        for (const part of payload.parts) {
            if (part.mimeType === 'text/plain') {
                body = urlSafeB64Decode(part.body.data);
                return body.trim();
            } else if (part.mimeType === 'text/html') {
                body = urlSafeB64Decode(part.body.data);
                return parser(body);
            } else if (part.parts) { 
                body = parseBody(part);
                if (body) { 
                    return body;
                }
            }
        }
    } else if (payload.mimeType === 'text/plain') {
        body = urlSafeB64Decode(payload.body.data).trim();
    } else if (payload.mimeType === 'text/html') {
        body = urlSafeB64Decode(payload.body.data);
        return parser(body);
    }
    return body;
}