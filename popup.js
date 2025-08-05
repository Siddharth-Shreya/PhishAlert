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
                renderResultsFromStorage();  
                return;
            }
            else {
                await chrome.storage.local.remove('authToken');
            }
        }
        checkAuthBtn.innerText = 'Sign In With Google';
        dynamicContent.innerHTML = '';
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
                renderResultsFromStorage();  
            });
        }
    }

    function renderResultsFromStorage() {
        chrome.storage.local.get('lastResults').then(({ lastResults }) => {
            dynamicContent.innerHTML = '<br>';
            if (!lastResults || !lastResults.length) {
                dynamicContent.innerHTML = '<p>No phishing emails found.</p>';
            }
            else {
                for (const email of lastResults) {
                     dynamicContent.innerHTML += `<li><b>${email.subject}</b><br><p>${email.date}</p><b>Phishing Probability: ${email.probability}</b><br><b>Phishing Prediction: ${email.prediction}</b></li>`;
                }
            }
        });
    }

    chrome.runtime.onMessage.addListener(msg => {
        if (msg.action === 'fetchStarted') {
            dynamicContent.innerHTML = '<p>Fetching emails...</p>';
        }
        else if (msg.action == 'fetchFinished') {
            renderResultsFromStorage();
        }
    });

    const checkAuthBtn = document.getElementById('checkAuth');
    const dynamicContent = document.getElementById('dynamicContent');
    authInit();
    checkAuthBtn.addEventListener('click', handleAuthClick);
});