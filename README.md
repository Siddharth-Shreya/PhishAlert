# PhishAlert
### What it is:
PhishAlert is a powerful chromium based extension that utilizes machine learning data to detect spam and phishing emails- straight out of your inbox.

### How does it work:
PhishAlert's python backend model is trained on over thousands of emails to gain an upwards of 97% accuracy in detecting suspicious messages in Gmail. Phishalert uses Google's OAuth2 for authentication to Google's Gmail API to fetch messages directly from Gmail's inbox and locally test and send feedback on the condition of the email.

### Dataset
Phishing email dataset from [Kaggle](https://www.kaggle.com/datasets/naserabdullahalam/phishing-email-dataset/data?select=CEAS_08.csv), which contains sample emails from a variety of sources (The Enron, Ling, CEAS, Nazario, Nigerian & SpamAssassin Datasets) and labels the emails as phishing or non-phishing. We utilized the CEAS_08 dataset in particular to train our model.
Citation:
Al-Subaiey, A., Al-Thani, M., Alam, N. A., Antora, K. F., Khandakar, A., & Zaman, S. A. U. (2024, May 19). Novel Interpretable and Robust Web-based AI Platform for Phishing Email Detection. ArXiv.org. https://arxiv.org/abs/2405.11619

### Why we made it:
As the digital age reaches it's climax and data is becoming less personal, a greater number of users are exposed to and may fall victim to the internet's brutal scams and phishing attempts. Email services like Gmail do their best to protect users from having their data compromised, however, are often prone to error. PhishAlert serves as a failsafe and a second opinion for such emails, and aims to eliminate this issue for good.
