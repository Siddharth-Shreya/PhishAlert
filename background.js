async function safeSendMessage(msg) {
    try {
        await chrome.runtime.sendMessage(msg);
    }
    catch (e) {
        console.log('No listener for message:', msg.action, e.message);
    }
}

chrome.runtime.onMessage.addListener(async function (message, sendResponse) {
    if (message.action === 'popupOpened') {
        try {
            await handleScanClick();
            safeSendMessage({ action: 'fetchFinished', results: [] });
        }
        catch (e) {
            safeSendMessage({ action: 'fetchFailed', error: e.message });
        }
    }

    if (message.action === 'getAuthToken') {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            sendResponse({ token });
        });
        return true;
    }
});

chrome.runtime.onStartup.addListener(async function () {
    try {
        await handleScanClick();
        safeSendMessage({ action: 'fetchFinished', results: [] });
    }
    catch (e) {
        safeSendMessage({ action: 'fetchFailed', error: e.message });
    }
})

chrome.runtime.onInstalled.addListener(async function () {
    try {
        await handleScanClick();
        safeSendMessage({ action: 'fetchFinished', results: [] });
    }
    catch (e) {
        safeSendMessage({ action: 'fetchFailed', error: e.message });
    }
})

chrome.alarms.create('scheduledEmailFetch', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async function (alarm) {
    if (alarm.name !== 'scheduledEmailFetch') return;
    safeSendMessage({ action: 'fetchStarted' });

    try {
        await handleScanClick();
    }
    catch (e) {
        safeSendMessage({ action: 'fetchFailed', error: e.message });
    }
});

async function handleScanClick () {
    const { authToken } = await chrome.storage.local.get('authToken');

    if (!authToken) {
        console.error('No auth token found');
        return;
    }

    const { gmailQuery } = await chrome.storage.local.get('gmailQuery');

    const params = { method: 'GET', headers: { 'Authorization': 'Bearer ' + authToken } };
    const queryUrl = gmailQuery || 'https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:anywhere AND -in:spam AND -in:trash AND (newer_than:2d OR is:unread)'
    const messagesResponse = await fetch(queryUrl, params);
    const { messages } = await messagesResponse.json();

    if (!messages) return [];

    return fetchEmails(messages, params);
}

async function fetchEmails (messages, params) {
    const scamEmails = [];
    for (const msg of messages) {
        const msgResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, params);
        const msgData = await msgResponse.json();

        let subject = '', date = '', body = '', sender = '', receiver = '', urls = 'https://gmail.google.com';

        for (const header of msgData.payload.headers) {
            if (header.name === 'Subject') subject = header.value;
            if (header.name === 'Date') date = header.value;
            if (header.name === 'From') sender = header.value;
            if (header.name === 'To') receiver = header.value;
        }

        body = parseBody(msgData.payload);

        process.loadEnvFile('.env');
        const flaskPayload = { subject, body, sender, receiver, date, urls };
        const flaskResult = await fetch(process.env.API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(flaskPayload) });
        const flaskData = await flaskResult.json();

        if (flaskData.prediction == 1) {
            scamEmails.push({ subject, date, probability: flaskData.probability, prediction: flaskData.prediction });
        }
    }
    try {
        safeSendMessage({ action: 'fetchFinished', results: scamEmails });
    }
    catch (e) {
        safeSendMessage({ action: 'fetchFailed', error: e.message });
    }
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