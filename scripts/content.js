function isEmailOpen() {
    if (window.location.host.includes("mail.google.com") || window.location.host.includes("outlook.live.com")) {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    const emailElement = document.querySelector('div[role="main"]');
                    if (emailElement) {
                        const siteName = window.location.host.includes("mail.google.com") ? "Gmail" : "Outlook";
                        console.log(`Scanning ${siteName} email...`);
                        alert(`Scanning ${siteName} email...`);
                    }
                }
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
}
isEmailOpen();
