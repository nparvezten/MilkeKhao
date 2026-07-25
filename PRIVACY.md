# Customer Data Retention & Privacy Policy (DPDP Act Compliance)

This document outlines the data protection, encryption, and privacy architecture implemented across the MilkeKhao Multi-Tenant Food Delivery Platform in accordance with India's **Digital Personal Data Protection (DPDP) Act, 2023** and global OWASP security guidelines.

---

## 1. Personally Identifiable Information (PII) Handled
MilkeKhao collects and processes the following customer PII strictly for order fulfillment:
- Customer Full Name
- Customer Contact Phone Number
- Delivery Street Address, City, State, and Pincode
- Transaction Payment References (UPI RRN / Gateway Order IDs)

---

## 2. Encryption at Rest & Blind Indexing Architecture
To prevent data leaks and satisfy VAPT compliance:
1. **AES-256 Field-Level Encryption**:
   - Customer Delivery Address and Phone Numbers are encrypted before persistence in PostgreSQL using `AesEncryptionService` with AES-256-GCM.
2. **HMAC-SHA256 Blind Indexing**:
   - Phone numbers are stored alongside a cryptographic HMAC-SHA256 blind hash. This permits exact phone lookups for customer order history without exposing plain-text phone numbers in unencrypted query logs or database indexes.

---

## 3. Data Retention & Automatic Purging Policy
- **Active Orders**: Retained in primary operational database tables (`Orders`, `OrderItems`, `OrderStatusHistories`) for 90 days.
- **Completed Orders Audit Log**: Archived into encrypted cold storage after 90 days.
- **Anonymization**: Customer PII (name, phone, delivery address) is permanently redacted after 180 days from order completion, leaving non-identifiable financial audit records for tax/accounting purposes.

---

## 4. Customer Data Rights & Opt-Out
Under the DPDP Act, customers reserve the right to:
- Request a copy of all stored personal data associated with their phone number.
- Request immediate erasure/anonymization of customer profile data upon account closure.
- Opt out of non-essential SMS/Email marketing notifications.
