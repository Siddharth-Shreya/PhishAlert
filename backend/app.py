from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import string
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer
from pathlib import Path

### Suggested Fix by AI
from nltk import download
download('stopwords')
###

app = Flask(__name__)
CORS(app)

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

@app.route('/predict', methods=['POST'])
def predict():
    data = request.get_json()

    subject = data.get('subject', '')
    body = data.get('body', '')
    sender = data.get('sender', '')
    receiver = data.get('receiver', '')
    date = data.get('date', '')
    urls = data.get('urls', '')

    combined_email = f'{sender} {receiver} {date} {subject} {body} {urls}'
    preprocessed_email = preprocess(combined_email)
    transformed_email = vectorizer.transform([preprocessed_email])
    prediction = int(model.predict(transformed_email)[0])
    probability = float(model.predict_proba(transformed_email)[0][1])
    
    print(f'Phishing Prediction: {prediction}')
    print(f'Phishing Probability: {probability}')

    return jsonify({'prediction': prediction, 'probability': probability})

def main():
    model = pickle.load(open('../ml-model/email_phishing_detection.pkl', 'rb'))
    vectorizer = pickle.load(open('../ml-model/count_vectorizer.pkl', 'rb'))

if __name__ == '__main__':
    main()