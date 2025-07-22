#!/bin/bash

echo "🧪 Testing CloudContactAI Email API with curl..."

curl -v -X POST "https://email-campaigns.cloudcontactai.com/api/v1/campaigns" \
  -H "Authorization: Bearer eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJpbmZvQGFsbGNvZGUuY29tIiwiaXNzIjoiY2xvdWRjb250YWN0IiwibmJmIjoxNzE5NDQwMjM2LCJpYXQiOjE3MTk0NDAyMzYsInJvbGUiOiJVU0VSIiwiY2xpZW50SWQiOjI2ODIsImlkIjoyNzY0LCJ0eXBlIjoiQVBJX0tFWSIsImtleV9yYW5kb21faWQiOiI1MGRiOTUzZC1hMjUxLTRmZjMtODI5Yi01NjIyOGRhOGE1YTAifQ.PKVjXYHdjBMum9cTgLzFeY2KIb9b2tjawJ0WXalsb8Bckw1RuxeiYKS1bw5Cc36_Rfmivze0T7r-Zy0PVj2omDLq65io0zkBzIEJRNGDn3gx_AqmBrJ3yGnz9s0WTMr2-F1TFPUByzbj1eSOASIKeI7DGufTA5LDrRclVkz32Oo" \
  -H "Content-Type: application/json" \
  -H "Accept: */*" \
  -d '{
  "subject": "Test Email",
  "title": "Curl Test",
  "message": "<p>Hello from curl!</p>",
  "senderEmail": "test@allcode.com",
  "replyEmail": "support@allcode.com",
  "senderName": "Test Sender",
  "accounts": [
    {
      "firstName": "Test",
      "lastName": "User",
      "email": "andreas@allcode.com",
      "phone": ""
    }
  ],
  "campaignType": "EMAIL",
  "addToList": "noList",
  "contactInput": "accounts",
  "fromType": "single",
  "senders": []
}'