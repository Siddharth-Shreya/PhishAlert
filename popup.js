document.addEventListener('DOMContentLoaded', () => {
    async function authInit() {
        const { authToken } = await chrome.storage.local.get('authToken');

        if (authToken) {
            checkAuthBtn.innerText = 'Sign Out'
            showScanEmailButton();
        }
        else {
            checkAuthBtn.innerText = 'Sign In With Google';
            dynamicContent.innerHTML = '';
        }
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
            chrome.runtime.sendMessage({ action: 'getAuthToken' }, async (response) => {
                if (!response) {
                    checkAuthBtn.innerText = 'Auth failed.';
                    return;
                }
                await chrome.storage.local.set({ authToken: response.token });
                checkAuthBtn.innerText = 'Sign Out';
                showScanEmailButton();
            });
        }
    }

    async function fetchEmails (messages, params) {
        dynamicContent.innerHTML = '<br>';

        for (const msg of messages) {
            const msgResponse = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, params);
            const msgData = await msgResponse.json();

            let subject = '', date = '', body = '', from = '';

            for (const header of msgData.payload.headers) {
                if (header.name === 'Subject') subject = header.value;
                if (header.name === 'Date') date = header.value;
            }

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