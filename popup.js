document.addEventListener('DOMContentLoaded', () => {
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
              chrome.storage.local.remove('authToken', () => {
                  checkAuthBtn.innerText = 'Sign in with Google';
                  dynamicContent.innerHTML = '';
            });
          }
          else{
              chrome.runtime.sendMessage({ action: 'getAuthToken' }, (response) => {
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
                            console.log('User Info:', data);
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
      dynamicContent.appendChild(scanEmailBtn);

      scanEmailBtn.addEventListener('click', () => {
          chrome.storage.local.get('authToken', (result) => {
              const token = result.authToken;
              fetch('https://www.googleapis.com/gmail/v1/users/me/messages', {
                  headers: {
                      'Authorization': 'Bearer ' + token
                  }
              })
              .then(response => response.json())
              .then(data => {
                  console.log('Emails:', data);
              })
              .catch(error => {
                  console.error('Error fetching emails:', error);
              });
          });
      });
  }
});