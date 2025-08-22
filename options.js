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
});