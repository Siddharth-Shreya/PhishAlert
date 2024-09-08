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
from apiclient import discovery
from apiclient import errors
from httplib2 import Http
from oauth2client import file, client, tools
import base64
from bs4 import BeautifulSoup
import re
import time
import dateutil.parser as parser
from datetime import datetime
import datetime
import csv


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

for mssg in mssg_list:
    temp_dict = { }
    m_id = mssg['id'] # get id of individual message
    message = GMAIL.users().messages().get(userId=user_id, id=m_id).execute() # fetch the message using API
    payld = message['payload'] # get payload of the message 
    headr = payld['headers'] # get header of the payload

    for one in headr: # getting the Subject
        if one['name'] == 'Subject':
            msg_subject = one['value']
            temp_dict['Subject'] = msg_subject
        else:
            pass

    for two in headr: # getting the date
        if two['name'] == 'Date':
            msg_date = two['value']
            
            msg_date = msg_date.split(" ")
            msg_date = " ".join(msg_date[:-1])
            temp_dict['Date'] = msg_date
        else:
            pass

    for three in headr: # getting the Sender
        if three['name'] == 'From':
            msg_from = three['value']
            temp_dict['Sender'] = msg_from
        else:
            pass

    for three in headr: # getting the Receiver
        if three['name'] == 'To':
            msg_from = three['value']
            temp_dict['Receiver'] = msg_from
        else:
            pass
	
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

    # Remove excessive internal whitespace and line breaks using regex
    # from ChatGPT
    temp_dict['Message_body'] = re.sub(r'\s+', ' ', get_body(payld).replace('\n', ' '))

    print(temp_dict)
    final_list.append(temp_dict) # This will create a dictonary item in the final list

    print("___________________________________________________\n\n")