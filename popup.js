document.addEventListener('DOMContentLoaded', () => {
    console.log("Popup loaded");
    const checkAuthBtn = document.getElementById('checkAuth');
    const dynamicContent = document.getElementById('dynamicContent');

    chrome.storage.local.get('authToken', (result) => {
        if(result.authToken){
            checkAuthBtn.innerText = 'Sign out';
            showScanEmailButton();
        }
        else{
            checkAuthBtn.innerText = 'Sign in with Google';
            dynamicContent.innerHTML = '';
        }
    });

    checkAuthBtn.addEventListener('click', () => {
        chrome.storage.local.get('authToken', (result) => {
            if(result.authToken){
                fetch(`https://accounts.google.com/o/oauth2/revoke?token=${result.authToken}`).then(() => {
                    chrome.storage.local.remove('authToken', () => {
                        checkAuthBtn.innerText = 'Sign in with Google';
                        dynamicContent.innerHTML = '';
                    });
                }).catch(error => {
                    console.error('Error revoking token:', error);
                });
            }
            else{
                chrome.runtime.sendMessage({ action: 'getAuthToken' }, (response) => {
                    console.log("Received token:", response.token);
                    if(!response.token){
                        checkAuthBtn.innerText = 'Authorization failed.';
                        return;
                    }

                    chrome.storage.local.set({ authToken: response.token }, () => {
                        checkAuthBtn.innerText = 'Sign out';
                        showScanEmailButton();

                        fetch('https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + response.token)
                            .then(response => response.json())
                            .then(data => {
                                if(data.error){
                                    console.error('Token is invalid or expired: ', data.error);
                                    return;
                                }
                                console.log('Token is valid: ', data);
                            })
                            .catch(error => {
                                console.error('Error fetching user info:', error);
                        });
                    });
                });
            }
        });
    });

    function showScanEmailButton(){
        dynamicContent.innerHTML = '';
        const scanEmailBtn = document.createElement('button');
        scanEmailBtn.id = 'checkEmails';
        scanEmailBtn.innerText = 'Scan Email';
        scanEmailBtn.addEventListener('click', () => {
            console.log("Scan Email button clicked");
            chrome.runtime.sendMessage({ action: 'getAuthToken' }, async (response) => {
                const token = response.token;
                if(!token){
                    console.error("No auth token.");
                    return;
                }
                let init = {
                    method: 'GET',
                    headers: {
                        Authorization: 'Bearer ' + token,
                        'Content-Type': 'application/json'
                    },
                };

                try{
                    const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages', init);
                    if(!resp.ok){
                        const text = await resp.text();
                        console.error('HTTP error response:', text);
                        throw new Error(`HTTP error! status: ${resp.status}`);
                    }
                    const data = await resp.json();
                    console.log('Emails: ', data);
                }
                catch(error){
                    console.error('Error fetching emails: ', error);
                }
            });
        });
        dynamicContent.appendChild(scanEmailBtn);
    }
});