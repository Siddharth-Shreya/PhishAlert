async function isTokenValid (token) {
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
    const authBtn = document.getElementById('authBtn');

    if (authToken) {
        const validToken = await isTokenValid(authToken);
        if (validToken) {
            authBtn.innerText = 'Sign Out';
            return;
        }
        else {
            await chrome.storage.local.remove('authToken');
        }
    }
    authBtn.innerText = 'Sign In With Google';
}

async function handleAuthClick () {
    const { authToken } = await chrome.storage.local.get('authToken');

    if (authToken) {
        try {
            await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${authToken}`);
            chrome.identity.removeCachedAuthToken({ token: authToken });
            await chrome.storage.local.remove('authToken');
            authBtn.innerText = 'Sign In With Google';
        }
        catch (e) {
            console.error('Error revoking oauth token:', e);
        }
    }
    else {
        chrome.identity.getAuthToken({ interactive: true }, async (token) => {
            if (!token) {
                authBtn.innerText = 'Auth failed.';
                return;
            }
            await chrome.storage.local.set({ authToken: token });
            authBtn.innerText = 'Sign Out';
            alert('Signed in successfully');  
        });
    }
}

function buildQuery () {
  let locations = [];
  if (document.getElementById('inbox').checked) locations.push('in:inbox');
  if (document.getElementById('sent').checked) locations.push('in:sent');
  if (document.getElementById('all').checked || locations.length === 0) locations = ['in:anywhere'];
  
  let query = locations.join(' OR ');
  if (document.getElementById('excludeSpam').checked) query += ' AND -in:spam';
  if (document.getElementById('excludeTrash').checked) query += ' AND -in:trash';

  return `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}`;
}

function saveQuery () {
  const queryUrl = buildQuery();
  chrome.storage.local.set({ gmailQuery: queryUrl });
}

document.addEventListener('DOMContentLoaded', async () => {
    ['inbox', 'sent', 'all', 'excludeSpam', 'excludeTrash'].forEach(id => {
        document.getElementById(id).onchange = saveQuery;
    });

    document.getElementById('authBtn').addEventListener('click', async () => {
        await handleAuthClick();
        await authInit();
    });
    await authInit();
    saveQuery();
});