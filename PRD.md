# Medicata Product Requirements Document (PRD)

This document outlines the core functional and non-functional requirements for the Medicata MVP.

## 1. Overview
Medicata is a healthcare platform bridging the gap between patients, healthcare providers (doctors), and pharmacies through digital interactions, electronic prescriptions, and streamlined order fulfillment.

---

## 2. Core User Journeys

### 2.1 Patient Journey
*   **Onboarding:** Sign up with personal and health info, verify phone/email.
*   **Dashboard:** Book consultations (online/in-person), find pharmacies, view past prescriptions, access "Medi" AI assistant.
*   **Booking:** Search by specialty/availability, view doctor profiles (ratings, experience), and receive confirmation.
*   **Consultation:** In-app video/chat or in-person. Receives digital prescription post-consultation.
*   **Pharmacy:** Search nearby pharmacies, send prescription, choose delivery/pickup, and track order status.

### 2.2 Doctor Journey
*   **Onboarding:** Professional info (Medical License Number, Specialties, Affiliation).
*   **Dashboard:** Manage appointments, access patient history (with consent).
*   **Consultation:** Accept bookings, conduct video calls, add clinical notes.
*   **Prescribing:** Generate digital prescriptions from drug database, set expiry dates, and send to patients or pharmacies.
*   **Analytics:** Track patient progress and past consultations.

### 2.3 Pharmacy Journey
*   **Onboarding:** Pharmacy info (License, Address, Hours).
*   **Dashboard:** View incoming prescriptions/orders, track pending/completed status.
*   **Fulfillment:** Review prescription details, check drug availability, update status (Ready/Out for Delivery).
*   **Reporting:** Inventory and order history management.

---

## 3. Key Feature Modules

### 3.1 Digital Prescription (E-Prescribe)
*   **Expiry Logic:** Mandatory expiry date for all prescriptions to prevent misuse.
*   **Sharing Card:** Exportable digital card (PDF/Image) with QR code verification.
*   **Refill Workflow:** "Buy Again" feature for expired prescriptions to request new orders based on previous data.
*   **Authenticity:** Unique IDs and doctor verified signatures/QR codes.

### 3.2 Consultation Management
*   **Modes:** Chat, Video, Audio, and In-person.
*   **Availability:** Doctors set recurring or one-time slots; patients book within those slots.
*   **Notifications:** Multi-channel reminders for appointments and follow-ups.

### 3.3 Pharmacy & Ordering
*   **Search:** GPS-based location or app recommendations.
*   **Logistics:** Support for both home delivery and pharmacy pickup.
*   **Tracking:** Real-time updates on order preparation and delivery status.

---

## 4. Technical Architecture
*   **Landing Page:** React + TypeScript (`/landing-page`).
*   **Mobile App:** React Native (`/mobile-app`).
*   **Backend Server:** Rust + Axum (`/server`).
*   **Security:** HIPAA-inspired data privacy, encryption at rest/transit, and secure WebRTC for telehealth.

---

## 5. MVP Priorities (V1)
*   [ ] Multi-role onboarding (Patient, Doctor, Pharmacy).
*   [ ] Telehealth video/chat implementation.
*   [ ] E-Prescription engine with QR verification.
*   [ ] Pharmacy search and order lifecycle tracking.
*   [ ] Basic AI Assistant "Medi" for onboarding and FAQs.
