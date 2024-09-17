function getAuthToken(callback){
  chrome.identity.getAuthToken({ interactive: true }, (token) => {
    if (chrome.runtime.lastError || !token) {
      console.error('Error getting auth token:', chrome.runtime.lastError?.message);
      callback(null);
      return;
    }
      callback(token);
    });
  }
  
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'getAuthToken') {
      getAuthToken((token) => {
        sendResponse({ token: token });
      });
      return true;
    }
  });  