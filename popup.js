document.addEventListener('DOMContentLoaded', () => {

    async function isTokenValid(token) {
        try {
            const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=` + token);
            return response.ok;
        }
        catch (e) {
            return false;
        }
    }

    async function authInit () {
        const { authToken } = await chrome.storage.local.get('authToken');

        if (authToken) {
            const validToken = await isTokenValid(authToken);
            if (validToken) {
                checkAuthBtn.innerText = 'Sign Out';
                showScanEmailButton();
                return;
            }
            else {
                await chrome.storage.local.remove('authToken');
            }
        }
        checkAuthBtn.innerText = 'Sign In With Google';
        dynamicContent.innerHTML = '';
    }
    
    function showScanEmailButton () {
        dynamicContent.innerHTML = '';
        const scanEmailBtn = document.createElement('button');
        scanEmailBtn.id = 'checkEmails';
        scanEmailBtn.innerText = 'Scan Email';
        dynamicContent.appendChild(scanEmailBtn);
        scanEmailBtn.addEventListener('click', handleScanClick);
    }

    async function handleScanClick () {
        const { authToken } = await chrome.storage.local.get('authToken');

        if (!authToken) {
            console.error('No auth token found');
            return;
        }

        const params = { method: 'GET', headers: { 'Authorization': 'Bearer ' + authToken } };

        try {
            const messagesResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=5', params);
            const { messages } = await messagesResponse.json();

            if (!messages) {
                dynamicContent.innerHTML += '<p>No emails found.</p>'
                return;
            }

            await fetchEmails(messages, params);
        }
        catch (e) {
            console.error('Error fetching emails using the API:', e);
        }
    }

    async function handleAuthClick () {
        const { authToken } = await chrome.storage.local.get('authToken');

        if (authToken) {
            try {
                await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${authToken}`);
                chrome.identity.removeCachedAuthToken({ token: authToken });
                await chrome.storage.local.remove('authToken');
                checkAuthBtn.innerText = 'Sign In With Google';
                dynamicContent.innerHTML = '';
            }
            catch (e) {
                console.error('Error revoking oauth token:', e);
            }
        }
        else {
            chrome.identity.getAuthToken({ interactive: true }, async (token) => {
                if (!token) {
                    checkAuthBtn.innerText = 'Auth failed.';
                    return;
                }
                await chrome.storage.local.set({ authToken: token });
                checkAuthBtn.innerText = 'Sign Out';
                showScanEmailButton();
            });
        }
    }

    function parseBody(payload) {
        let body = '';

        function urlSafeB64Decode(str) {
            const base64Encoded = str.replace(/-/g, '+').replace(/_/g, '/');
            const padding = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
            const base64WithPadding = base64Encoded + padding;
            return atob(base64WithPadding)
                .split('')
                .map(char => String.fromCharCode(char.charCodeAt(0)))
                .join('');
        }

        if (payload.parts) {
            for (const part of payload.parts) {
            if (part.mimeType === 'text/plain') {
                body = urlSafeB64Decode(part.body.data);
                console.log("body:", body)
                return body.trim();
            } else if (part.mimeType === 'text/html') {
                body = urlSafeB64Decode(part.body.data);
                const parser = new DOMParser();
                const doc = parser.parseFromString(body, 'text/html');
                console.log("body:", doc.body ? doc.body.textContent.trim() : '')
                return doc.body ? doc.body.textContent.trim() : '';
            } else if (part.parts) { 
                body = parseBody(part);
                if (body) { 
                    console.log("body:", body)
                    return body;
                }
            }
            }
        } else if (payload.mimeType === 'text/plain') {
            body = urlSafeB64Decode(payload.body.data).trim();
        } else if (payload.mimeType === 'text/html') {
            body = urlSafeB64Decode(payload.body.data);
            const parser = new DOMParser();
            const doc = parser.parseFromString(body, 'text/html');
            body = doc.body ? doc.body.textContent.trim() : '';
        }

        console.log("body:", body)

        return body;
    }



    async function fetchEmails (messages, params) {
        dynamicContent.innerHTML = '<br>';

        for (const msg of messages) {
            const msgResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, params);
            const msgData = await msgResponse.json();

            console.log("Message data")
            console.log(msgData)

            let subject = '', date = '', body = '', from = '';

            for (const header of msgData.payload.headers) {
                if (header.name === 'Subject') subject = header.value;
                if (header.name === 'Date') date = header.value;
            }

            body = parseBody(msgData.payload);

            const flaskPayload = { subject, body, sender: from, date };
            const flaskResult = await fetch('http://localhost:5000/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(flaskPayload) });
            const flaskData = await flaskResult.json();

            dynamicContent.innerHTML += `<li><b>${subject}</b><br><p>${date}</p><b>Phishing Probability: ${flaskData.probability}</b><br><b>Phishing Prediction: ${flaskData.prediction}</b></li>`;
        }
    }

    const checkAuthBtn = document.getElementById('checkAuth');
    const dynamicContent = document.getElementById('dynamicContent');
    authInit();
    checkAuthBtn.addEventListener('click', handleAuthClick);
    }
);