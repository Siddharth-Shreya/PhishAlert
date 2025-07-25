#!/bin/bash

subjects=("Important" "Free Promotions" "CLICK NOW")
bodies=("Kindly click this link:" "A suspicious login was detected..." "NOT A SCAM PLEASE CLICK NOW")
senders=("noreply@google.com" "noreply@chase.com" "weirdemail@sus.sus")
url="http://example.com"

for ((i=1; i<=1000; i++)); do
    subject=${subjects[$RANDOM % ${#subjects[@]}]}
    body=${bodies[$RANDOM % ${#bodies[@]}]}
    sender=${senders[$RANDOM % ${#senders[@]}]}
    receiver="exampleuser@example.com"
    date=$(date '+%Y-%m-%d')

    json='{"subject":"'"$subject"'","body":"'"$body"'","sender":"'"$sender"'","receiver":"'"$receiver"'","date":"'"$date"'","urls":"'"$url"'"}'

    RESPONSE=$(curl -s -X POST http://localhost:5000/predict -H "Content-Type: application/json" -d "$json")

    echo "Subject: $subject | Body: $body | Prediction: $RESPONSE"
done
