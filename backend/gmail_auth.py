from apiclient import discovery
from httplib2 import Http
from oauth2client import file, client, tools
import base64
from bs4 import BeautifulSoup
import re

'''

FROM : https://github.com/abhishekchhibber/Gmail-Api-through-Python/blob/master/gmail_read.py
CREDIT TO Abhishek Chhibber
'''

'''
This script does the following:
- Go to Gmail inbox
- Find and read all the unread messages
- Extract details (Date, Sender, Subject, Receiver, Body)
'''

'''
Before running this script, the user should get the authentication by following 
the link: https://developers.google.com/gmail/api/quickstart/python
Also, client_secret.json should be saved in the same directory as this file
'''

# Importing required libraries

# Creating a storage.JSON file with authentication details
SCOPES = 'https://www.googleapis.com/auth/gmail.readonly'
store = file.Storage('storage.json') 
creds = store.get()
if not creds or creds.invalid:
    flow = client.flow_from_clientsecrets('client.json', SCOPES)
    creds = tools.run_flow(flow, store)
GMAIL = discovery.build('gmail', 'v1', http=creds.authorize(Http()))

user_id =  'me'
label_id_one = 'INBOX'

# Getting all the emails from Inbox
msgs = GMAIL.users().messages().list(userId='me',labelIds=[label_id_one]).execute()

# We get a dictonary. Now reading values for the key 'messages'
mssg_list = msgs['messages']

final_list = [ ]

header_map = {
    'Subject': 'Subject',
    'Date': 'Date',
    'From': 'Sender',
    'To': 'Receiver'
}

# from ChatGPT
def get_body(payload):
    body = ''
    if 'parts' in payload:
        for part in payload['parts']:
            if part['mimeType'] == 'text/plain':
                body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                return body.strip()
            elif part['mimeType'] == 'text/html':
                body = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8')
                soup = BeautifulSoup(body, "lxml").get_text()
                return soup.strip()
            elif 'parts' in part:  # multipart within multipart
                body = get_body(part)
    elif payload.get('mimeType') == 'text/plain':
        body = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8').strip()
    elif payload.get('mimeType') == 'text/html':
        body = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8')
        soup = BeautifulSoup(body, "lxml").get_text().strip()
        body = soup
    return body

for mssg in mssg_list:
    temp_dict = { }
    m_id = mssg['id'] # get id of individual message
    message = GMAIL.users().messages().get(userId=user_id, id=m_id).execute() # fetch the message using API
    payld = message['payload'] # get payload of the message 
    headr = payld['headers'] # get header of the payload

    for header in headr:
        if header['name'] in header_map:
            value = header['value']
            if header['name'] == 'Date':
                value = ' '.join(value.split(' ')[:-1])
            temp_dict[header_map[header['name']]] = value

    # Remove excessive internal whitespace and line breaks using regex
    # from ChatGPT
    temp_dict['Message_body'] = re.sub(r'\s+', ' ', get_body(payld).replace('\n', ' '))

    print(temp_dict)
    final_list.append(temp_dict) # This will create a dictonary item in the final list

    print("___________________________________________________\n\n")