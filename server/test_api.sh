#!/bin/bash

BASE_URL="http://localhost:3000/api"

echo "--- 1. Register Patient ---"
curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Patient One", "email": "patient@me.com", "phone": "08011122233", "password": "password123", "role": "patient"}' | jq .

echo -e "\n--- 2. Login Patient ---"
P_TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "patient@me.com", "password": "password123"}' | jq -r .token)
echo "Patient Token: $P_TOKEN"

echo -e "\n--- 3. Create Patient Profile ---"
curl -s -X POST $BASE_URL/profile/patient \
  -H "Authorization: Bearer $P_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"age": 28, "gender": "Female", "blood_group": "O+"}' | jq .

echo -e "\n--- 4. Register Doctor ---"
curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name": "Dr. Connor", "email": "doctor@me.com", "phone": "08099988877", "password": "password123", "role": "doctor"}' | jq .

echo -e "\n--- 5. Login Doctor ---"
D_TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "doctor@me.com", "password": "password123"}' | jq -r .token)
echo "Doctor Token: $D_TOKEN"

echo -e "\n--- 6. Create Doctor Profile ---"
D_ID=$(curl -s -X POST $BASE_URL/profile/doctor \
  -H "Authorization: Bearer $D_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"specialty": "General Physician", "license_number": "MD-4455", "experience_years": 10, "bio": "Specialist in primary care.", "consultation_fee": 5000}' | jq -r .doctor_id)
echo "Doctor ID: $D_ID"

echo -e "\n--- 7. Search Doctors (as Patient) ---"
curl -s -X GET "$BASE_URL/doctors/search?specialty=General" \
  -H "Authorization: Bearer $P_TOKEN" | jq .

echo -e "\n--- 8. Book Consultation (as Patient) ---"
C_ID=$(curl -s -X POST $BASE_URL/consultations \
  -H "Authorization: Bearer $P_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"doctor_id\": \"$D_ID\", \"scheduled_at\": \"2026-06-15T10:30:00Z\", \"mode\": \"Video\", \"reason\": \"Frequent fever\", \"symptoms\": \"Chills, Headache\"}" | jq -r .id)
echo "Consultation ID: $C_ID"

echo -e "\n--- 9. Accept Consultation (as Doctor) ---"
curl -s -X PATCH $BASE_URL/consultations/$C_ID/status \
  -H "Authorization: Bearer $D_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "Accepted"}' | jq .

echo -e "\n--- 10. Get Notifications (as Patient) ---"
curl -s -X GET $BASE_URL/notifications \
  -H "Authorization: Bearer $P_TOKEN" | jq .

echo -e "\n--- Test Complete ---"
