document.addEventListener('DOMContentLoaded', () => {
    chrome.storage.local.get('authToken', (result) => {
      if (result.authToken) {
        document.getElementById('checkEmails').innerText = 'Signed in with Google';
      } else {
        document.getElementById('checkEmails').innerText = 'Sign in with Google';
      }
    });
  
    document.getElementById('checkEmails').addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'getAuthToken' }, (response) => {
        if (!response.token) {
          document.getElementById('checkEmails').innerText = 'Authorization failed.';
          return;
        }
  
        chrome.storage.local.set({ authToken: response.token }, () => {
          document.getElementById('checkEmails').innerText = 'Signed in with Google';
          fetch('https://www.googleapis.com/oauth2/v1/userinfo?access_token=' + response.token)
            .then(response => response.json())
            .then(data => {
              console.log('User Info:', data);
            })
            .catch(error => {
              console.error('Error fetching user info:', error);
            });
        });
      });
    });
  });  