from flask import Flask, request
import pickle
import string
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer
from pathlib import Path

app = Flask(__name__)

model = pickle.load(open(Path('../ml-model/email_phishing_detection.pkl'), 'rb'))
vectorizer = pickle.load(open(Path('../ml-model/count_vectorizer.pkl'), 'rb'))

def preprocess(email):
    stemmer = PorterStemmer()
    stopwords_set = set(stopwords.words('english'))
    email = email.lower()
    email = email.translate(str.maketrans("", "", string.punctuation)).split()
    email = [stemmer.stem(word) for word in email if word not in stopwords_set]
    email = " ".join(email)
    return email

@app.route('/predict', methods=['POST', 'GET'])
def predict():
    data = request.json
    subject = data.subject
    body = data.body
    sender = data.sender
    receiver = data.receiver
    date = data.date
    urls = data.urls
    combined_email = f"{sender} {receiver} {date} {subject} {body} {urls}"
    preprocessed_email = preprocess(combined_email)
    transformed_email = vectorizer.transform([preprocessed_email])
    prediction = model.predict(transformed_email)[0]
    probability = model.predict_proba(transformed_email)[0][1]
    print(f"Phishing Prediction: {prediction}")
    print(f"Phishing Probability: {probability}")

# Testing

def main():
    model = pickle.load(open('../ml-model/email_phishing_detection.pkl', 'rb'))
    vectorizer = pickle.load(open('../ml-model/count_vectorizer.pkl', 'rb'))


if __name__ == '__main__':
    main()