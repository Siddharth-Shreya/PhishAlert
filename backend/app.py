from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import string
import nltk
from nltk.corpus import stopwords
from nltk.stem.porter import PorterStemmer
from pathlib import Path
import redis
import xxhash
import json

app = Flask(__name__)
CORS(app)

try:
    nltk.data.find('corpora/stopwords')
except LookupError:
    nltk.download('stopwords')

r = redis.Redis(host = 'redis', port = 6379, db = 0, socket_connect_timeout = 2)

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

def get_cache_key(data):
    data_str = f"{data['subject']} {data['body']} {data['sender']} {data['receiver']} {data['date']} {data['urls']}"
    return xxhash.xxh128_hexdigest(data_str)

@app.route('/predict', methods=['POST'])
def predict():
    if not request.is_json:
        return jsonify({'error': 'Unsupported Media Type'}), 415
    
    data = request.get_json()
    if not data or data is None or '' in data:
        return jsonify({'error': 'Invalid or missing JSON'}), 400

    required_fields = ['subject', 'body', 'sender', 'receiver', 'date', 'urls']
    missing_fields = [field for field in required_fields if field not in data or data[field] is None or str(data[field]).strip() == '' or not isinstance(data[field], str)]
    
    if missing_fields:
        return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
    
    # Cache hit check before computing
    cache_key = get_cache_key(data)
    cache_res = r.get(cache_key)

    try:
        cache_key = get_cache_key(data)
        if r.ping():
            cache_res = r.get(cache_key)
            if cache_res:
                return jsonify(json.loads(cache_res.decode('utf-8'))), 200
    except Exception as e:
        return jsonify({'error': 'Error processing cache data', 'details': str(e)}), 500

    subject = data['subject']
    body = data['body']
    sender = data['sender']
    receiver = data['receiver']
    date = data['date']
    urls = data['urls']

    combined_email = f'{sender} {receiver} {date} {subject} {body} {urls}'
    preprocessed_email = preprocess(combined_email)
    transformed_email = vectorizer.transform([preprocessed_email])
    prediction = int(model.predict(transformed_email)[0])
    probability = float(model.predict_proba(transformed_email)[0][1])

    result = {'prediction': prediction, 'probability': probability}

    try:
        r.setex(cache_key, 7200, json.dumps(result))
    except Exception as e:
        print(f'Couldn\'t add to cache: {e}')
        pass

    # print(f'Phishing Prediction: {prediction}')
    # print(f'Phishing Probability: {probability}')

    return jsonify(result), 200

def main():
    # model = pickle.load(open('../ml-model/email_phishing_detection.pkl', 'rb'))
    # vectorizer = pickle.load(open('../ml-model/count_vectorizer.pkl', 'rb'))
    pass

if __name__ == '__main__':
    pass
