# Module to test API route and preprocessing

import pytest

import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from app import app

url = 'http://localhost:5000/predict'
headers = {'Content-Type': 'application/json'}
intact_payload = {
    'subject': 'Action Required: Password Expiration for Microsoft 365',
    'body': 'Your Microsoft 365 password will expire in 24 hours. To avoid disruption, reset your password now using the secure link below.',
    'sender': 'security@microsoftonline.com',
    'receiver': 'john.doe@example.com',
    'date': '2025-07-29',
    'urls': 'https://login.microsoftonline.com/?wa=wsignin1.0'
}

@pytest.fixture
def client():
    with app.test_client() as client:
        yield client

@pytest.mark.parametrize('missing_field', ['subject', 'body', 'sender', 'receiver', 'date', 'urls'])
def test_predict_with_missing_required_fields(missing_field, client):
    payload = intact_payload.copy()
    payload.pop(missing_field)
    response = client.post('/predict', json = payload)

    assert response.status_code == 400
    assert 'Missing required fields' in response.json['error']
    assert missing_field in response.json['error']

@pytest.mark.parametrize('extraneous_field', [None, '', ' '])
def test_predict_with_empty_or_null_fields(extraneous_field, client):
    for key in intact_payload.keys():
        payload = intact_payload.copy()
        payload[key] = extraneous_field
        response = client.post('/predict', json = payload)

        assert response.status_code == 400
        assert 'Missing required fields' in response.json['error']
        assert key in response.json['error']

@pytest.mark.parametrize('malformed_field', ['subject', 'body', 'sender', 'receiver', 'date', 'urls'])
def test_non_string_fields(malformed_field, client):
    payload = intact_payload.copy()
    payload[malformed_field] = 123456789
    response = client.post('/predict', json = payload)

    assert response.status_code == 400
    assert 'Missing required fields' in response.json['error']

@pytest.mark.parametrize('empty_json', [{}, None, {'':''}, {'':None}])
def test_empty_json_body(empty_json, client):
    response = client.post('/predict', json = empty_json)
    assert response.status_code in (400, 415)
    assert response.json['error'] in ('Invalid or missing JSON', 'Unsupported Media Type')