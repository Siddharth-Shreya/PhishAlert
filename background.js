chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === 'getAuthToken') {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
            sendResponse({ token });
        });
        return true;
    }
});