document.addEventListener('DOMContentLoaded', () => {
    const dynamicContent = document.getElementById('dynamicContent');

    chrome.runtime.onMessage.addListener(msg => {
        if (msg.action === 'fetchStarted') {
            dynamicContent.innerHTML = '<p>Fetching emails...</p>';
        }
        else if (msg.action === 'fetchFinished') {
            dynamicContent.innerHTML = '<br>';
            const lastResults = msg.results;
            if (!lastResults || !lastResults.length) {
                dynamicContent.innerHTML = '<p>No potential threats found.</p>';
            }
            else {
                for (const email of lastResults) {
                    dynamicContent.innerHTML += `<li><b>${email.subject}</b><br><p>${email.date}</p><b>Phishing Probability: ${email.probability}</b><br><b>Phishing Prediction: ${email.prediction}</b></li>`;
                }
            }
        }
        else if (msg.action === 'fetchFailed') {
            dynamicContent.innerHTML = `<p>Error: ${msg.error || 'Failed to fetch emails'}</p>`;
        }
    });
});