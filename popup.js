document.addEventListener('DOMContentLoaded', () => {
    console.log("Popup loaded");
    const checkAuthBtn = document.getElementById('checkAuth');
    const dynamicContent = document.getElementById('dynamicContent');

    chrome.storage.local.get('authToken', (result) => {
        if (result.authToken) {
            checkAuthBtn.innerText = 'Sign out';
            showScanEmailButton();
        } else {
            checkAuthBtn.innerText = 'Sign in with Google';
            dynamicContent.innerHTML = '';
        }
    });

    checkAuthBtn.addEventListener('click', () => {
        chrome.storage.local.get('authToken', (result) => {
            if (result.authToken) {
                fetch(`https://accounts.google.com/o/oauth2/revoke?token=${result.authToken}`)
                    .then(() => {
                        chrome.storage.local.remove('authToken', () => {
                            checkAuthBtn.innerText = 'Sign in with Google';
                            dynamicContent.innerHTML = '';
                        });
                    })
                    .catch(error => {
                        console.error('Error revoking token:', error);
                    });
            } else {
                chrome.runtime.sendMessage({ action: 'getAuthToken' }, (response) => {
                    if (!response || !response.token) {
                        checkAuthBtn.innerText = 'Authorization failed.';
                        return;
                    }
                    chrome.storage.local.set({ authToken: response.token }, () => {
                        checkAuthBtn.innerText = 'Sign out';
                        showScanEmailButton();
                    });
                });
            }
        });
    });

    function showScanEmailButton() {
        dynamicContent.innerHTML = '';
        const scanEmailBtn = document.createElement('button');
        scanEmailBtn.id = 'checkEmails';
        scanEmailBtn.innerText = 'Scan Email';
        dynamicContent.appendChild(scanEmailBtn);

        scanEmailBtn.addEventListener('click', () => {
            chrome.storage.local.get('authToken', (result) => {
                const token = result.authToken;
                if (!token) {
                    console.error("No auth token.");
                    return;
                }

                const init = {
                    method: 'GET',
                    headers: {
                        Authorization: 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    }
                };

                fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages', init)
                    .then(response => response.json())
                    .then(data => {
                        console.log('Emails:', data);
                        fetchEmails(data.messages, init, dynamicContent);
                    })
                    .catch(error => {
                        console.error('Error fetching emails:', error);
                    });
            });
        });
    }

    async function fetchEmails(messages, init, dynamicContent) {
        if (!messages) {
            dynamicContent.innerHTML += '<p>No emails found.</p>';
            return;
        }

        const emailDetails = [];
        for (const msg of messages.slice(0, 5)) {
            const msgResponse = await fetch(
                `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
                init
            );
            const msgData = await msgResponse.json();
            const headers = msgData.payload?.headers || [];
            const subject = headers.find(h => h.name === "Subject")?.value || "(No Subject)";
            const from = headers.find(h => h.name === "From")?.value || "(No Sender)";
            const date = headers.find(h => h.name === "Date")?.value || "";
            const snippet = msgData.snippet || "";
            emailDetails.push({ subject, body: snippet, sender: from, receiver: "", date, urls: "" });
        }

        try {
            const response = await fetch('https://localhost:5000/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(emailDetails),
            });

            const result = await response.json();
            if (result && result.prediction === 1) {
                // Handle the prediction logic here
            }
            dynamicContent.innerHTML += '<h> </h>';
        } catch (err) {
            console.error('Error predicting email:', err);
        }
    }
});
