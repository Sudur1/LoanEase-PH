# LoanEase PH Database Setup Guide

## Overview
This database is designed for the LoanEase PH lending/BNPL application. It manages users, loans, and available items for purchase.

---

## Database Tables

### 1. **USERS TABLE**
Stores user account and financial information.

**Fields:**
- `user_id` - Primary key (Auto-increment)
- `email` - Unique email address (login credential)
- `password_hash` - Hashed password (NEVER store plaintext)
- `first_name`, `last_name` - User name
- `phone` - Contact number
- `birth_date`, `gender` - Personal info
- `address`, `city`, `province`, `zip_code` - Address info
- `monthly_income` - For eligibility checking
- `employment_status` - Type of employment
- `other_debts` - Existing monthly debts
- `job_title`, `company_name`, `years_employed` - Employment info
- `id_type`, `id_number` - Government ID verification
- `status` - Account status (pending/verified/suspended)
- `account_created_at`, `account_updated_at` - Timestamps

**Current Status:** ❌ Empty (No data added yet)

---

### 2. **ITEMS TABLE**
Stores products available for purchase with loans.

**Fields:**
- `item_id` - Primary key (Auto-increment)
- `category` - Product category (phones, tv, appliances, gadgets, cars)
- `name` - Product name
- `specs` - Product specifications
- `price` - Original price (₱)
- `emoji` - Visual representation
- `base_interest_rate` - Default annual interest rate (%)
- `in_stock` - Availability status
- `created_at`, `updated_at` - Timestamps

**Current Status:** ✅ Populated with 24 items
- 8 Phones
- 4 TVs
- 5 Appliances
- 4 Gadgets
- 3 Cars

---

### 3. **LOANS TABLE**
Tracks active and historical loan records.

**Fields:**
- `loan_id` - Primary key (Auto-increment)
- `user_id` - Foreign key to users table
- `item_id` - Foreign key to items table
- `loan_amount` - Amount borrowed (₱)
- `monthly_payment` - Monthly payment required (₱)
- `interest_rate` - Applied annual interest rate (%)
- `term_months` - Loan duration (months)
- `total_amount` - Principal + Interest
- `status` - Loan status (pending/approved/active/completed/defaulted)
- `approval_date`, `start_date`, `end_date` - Important dates
- `paid_amount` - Amount already paid
- `months_paid` - Number of payments made
- `last_payment_date` - Date of last payment
- `created_at`, `updated_at` - Timestamps

**Current Status:** ❌ Empty (No data added yet)

---

### 4. **PAYMENT_SCHEDULES TABLE** (Optional but Recommended)
Tracks individual payment schedules for each loan.

**Fields:**
- `schedule_id` - Primary key
- `loan_id` - Foreign key to loans table
- `payment_number` - Which payment this is (1, 2, 3, etc.)
- `due_date` - When payment is due
- `principal_amount` - Principal portion of payment
- `interest_amount` - Interest portion of payment
- `payment_amount` - Total payment amount
- `status` - Payment status (pending/paid/late/missed)
- `paid_date` - Actual payment date

**Current Status:** ❌ Empty (No data added yet)

---

## How to Set Up the Database

### Step 1: Create Database
```sql
CREATE DATABASE loanease_ph;
USE loanease_ph;
```

### Step 2: Run the Schema
Copy the entire contents of `database.sql` and execute it in your MySQL client:

**Options:**
- **Via MySQL CLI:**
  ```bash
  mysql -u root -p loanease_ph < database.sql
  ```

- **Via phpMyAdmin:**
  1. Create database `loanease_ph`
  2. Go to "Import" tab
  3. Select `database.sql` file
  4. Click "Go"

- **Via MySQL Workbench:**
  1. Open the file in Workbench
  2. Execute the script

### Step 3: Verify Installation
Run these queries to verify all tables and data were created:

```sql
-- Check tables exist
SHOW TABLES;

-- Check items count
SELECT COUNT(*) as total_items FROM items;

-- View all items by category
SELECT category, COUNT(*) as count 
FROM items 
GROUP BY category;

-- View sample items
SELECT * FROM items LIMIT 5;

-- Check users table is empty
SELECT COUNT(*) FROM users;

-- Check loans table is empty
SELECT COUNT(*) FROM loans;
```

---

## Current Data Status

| Table | Records | Status |
|-------|---------|--------|
| **USERS** | 0 | ❌ Empty |
| **ITEMS** | 24 | ✅ Populated |
| **LOANS** | 0 | ❌ Empty |
| **PAYMENT_SCHEDULES** | 0 | ❌ Empty |

---

## Important Notes

### Password Security
⚠️ **NEVER** store passwords in plaintext. Always hash them before storing:
- Use bcrypt, Argon2, or PBKDF2
- Example (Node.js with bcrypt):
  ```javascript
  const hashedPassword = await bcrypt.hash(password, 10);
  ```

### Foreign Keys
- `loans.user_id` → `users.user_id` (ON DELETE CASCADE)
- `loans.item_id` → `items.item_id` (ON DELETE RESTRICT)
- `payment_schedules.loan_id` → `loans.loan_id` (ON DELETE CASCADE)

### Indexes
Indexes are created on frequently queried columns for performance:
- `users(email)` - For login queries
- `items(category, price, in_stock)` - For product searches
- `loans(user_id, status, start_date)` - For loan queries

---

## Next Steps

1. **Add User Data** - When ready, insert test user accounts
2. **Integrate with Backend** - Connect your PHP/Node.js backend to this database
3. **Set Up API Endpoints** - Create CRUD endpoints for users, loans, and items
4. **Add Validation** - Implement application-level validation for all inputs
5. **Enable Transactions** - Use database transactions for loan creation to ensure data integrity

---

## Database Relationships Diagram

```
users (1) -----> (N) loans (N) <----- (1) items
              
loans (1) -----> (N) payment_schedules
```

- 1 User can have many Loans
- 1 Item can be loaned many times
- 1 Loan has many Payment Schedules

---

## Quick Commands Reference

```sql
-- View all items
SELECT * FROM items ORDER BY category;

-- Count items per category
SELECT category, COUNT(*) FROM items GROUP BY category;

-- Find high-value items (useful for credit checks)
SELECT name, price FROM items WHERE price > 100000 ORDER BY price DESC;

-- Check database size
SELECT TABLE_NAME, ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'loanease_ph';
```

---

**Last Updated:** 2026-05-09  
**Application:** LoanEase PH  
**Database Type:** MySQL/MariaDB
