# Loan Items System - Multiple Items Per Loan

This guide explains how one loan can now cover multiple items.

---

## 📊 **Database Structure**

### **Updated LOANS Table**
```sql
CREATE TABLE loans (
    loan_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    loan_amount DECIMAL(12, 2),         -- Total of all items
    monthly_payment DECIMAL(10, 2),
    interest_rate DECIMAL(5, 2),
    term_months INT,
    total_amount DECIMAL(12, 2),        -- Principal + Interest
    total_items INT,                    -- How many items in this loan
    status ENUM(...) DEFAULT 'pending',
    ...
);
```

### **New LOAN_ITEMS Table**
```sql
CREATE TABLE loan_items (
    loan_item_id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT NOT NULL,               -- Which loan
    item_id INT NOT NULL,               -- Which item
    quantity INT DEFAULT 1,             -- How many of this item
    item_price DECIMAL(12, 2),          -- Price at purchase time
    added_at TIMESTAMP,
    
    FOREIGN KEY (loan_id) REFERENCES loans(loan_id),
    FOREIGN KEY (item_id) REFERENCES items(item_id)
);
```

**Key Changes:**
- Removed `item_id` from loans table
- Loans no longer tied to single item
- One loan can have multiple items via loan_items table
- Item price captured at time of purchase

---

## 🔄 **How It Works**

### **Data Relationships**
```
User (1) → Loans (Many) → Loan Items (Many) → Items (Many)
```

**Example: Juan's Loan**
```
Loan ID: 1
User ID: 1
Total Amount: ₱309,970
Monthly Payment: ₱25,831
Term: 12 months
Status: Active

Items in this loan:
  1. iPhone 16 Pro Max (qty: 2) → ₱259,980
  2. Samsung Galaxy S25 (qty: 1) → ₱89,990
  (Total: 3 items = ₱309,970)
```

---

## 🌐 **API Endpoints**

### **1. POST /api/loans/create**
Create a loan with multiple items

**Request:**
```json
{
  "user_id": 1,
  "interest_rate": 12,
  "term_months": 12,
  "items": [
    {
      "item_id": 1,
      "quantity": 2
    },
    {
      "item_id": 5,
      "quantity": 1
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Loan created successfully with multiple items",
  "loan_id": 1,
  "loan_amount": 309970,
  "monthly_payment": 25831.25,
  "total_amount": 309975,
  "total_items": 2
}
```

---

### **2. GET /api/loans/:loan_id**
Get loan details with all items and payment schedule

**Request:**
```
GET /api/loans/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "loan": {
      "loan_id": 1,
      "user_id": 1,
      "loan_amount": 309970,
      "monthly_payment": 25831.25,
      "interest_rate": 12,
      "term_months": 12,
      "total_amount": 309975,
      "total_items": 2,
      "status": "active",
      "paid_amount": 51662.50,
      "months_paid": 2
    },
    "items": [
      {
        "loan_item_id": 1,
        "item_id": 1,
        "quantity": 2,
        "item_price": 129990,
        "name": "iPhone 16 Pro Max",
        "emoji": "📱",
        "category": "phones",
        "agent_name": "Apple Philippines"
      },
      {
        "loan_item_id": 2,
        "item_id": 5,
        "quantity": 1,
        "item_price": 89990,
        "name": "Samsung Galaxy S25",
        "emoji": "📱",
        "category": "phones",
        "agent_name": "Samsung PH"
      }
    ],
    "payment_schedule": [
      {
        "schedule_id": 1,
        "payment_number": 1,
        "due_date": "2026-06-15",
        "payment_amount": 25831.25,
        "status": "paid",
        "paid_date": "2026-06-10"
      },
      ...
    ]
  }
}
```

---

### **3. GET /api/loans/user/:user_id**
Get all loans for a user

**Request:**
```
GET /api/loans/user/1
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "loan_id": 1,
      "user_id": 1,
      "loan_amount": 309970,
      "status": "active",
      "total_items": 2,
      "item_names": "iPhone 16 Pro Max, Samsung Galaxy S25",
      "item_count": 2
    },
    {
      "loan_id": 2,
      "user_id": 1,
      "loan_amount": 89990,
      "status": "pending",
      "total_items": 1,
      "item_names": "LG French Door Ref",
      "item_count": 1
    },
    {
      "loan_id": 3,
      "user_id": 1,
      "loan_amount": 895000,
      "status": "pending",
      "total_items": 1,
      "item_names": "Toyota Vios",
      "item_count": 1
    }
  ]
}
```

---

### **4. POST /api/loans/:loan_id/payment**
Record a payment for a loan

**Request:**
```json
{
  "payment_amount": 25831.25
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment recorded successfully",
  "loan_id": 1,
  "paid_amount": 77493.75,
  "months_paid": 3,
  "remaining_months": 9
}
```

---

### **5. PUT /api/loans/:loan_id/status**
Update loan status

**Request:**
```json
{
  "status": "approved"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Loan status updated",
  "loan_id": 1,
  "status": "approved"
}
```

**Valid statuses:**
- `pending` - Awaiting approval
- `approved` - Approved but not started
- `active` - Currently being paid
- `completed` - Fully paid
- `defaulted` - Payment missed

---

## 💡 **Real World Example**

### **Juan's Scenario**

**Day 1: Juan applies for a loan covering multiple items**
```
POST /api/loans/create
{
  "user_id": 1,
  "items": [
    {"item_id": 1, "quantity": 1},  // iPhone
    {"item_id": 5, "quantity": 1},  // Samsung
    {"item_id": 13, "quantity": 1}  // Fridge
  ],
  "interest_rate": 12,
  "term_months": 24
}

Response: loan_id=1 created with all 3 items
```

**Day 2: Juan checks loan details**
```
GET /api/loans/1

Response: Shows all 3 items + 24-month payment schedule
```

**Day 8: Juan makes first payment**
```
POST /api/loans/1/payment
{
  "payment_amount": 18332.50
}

Response: Payment recorded, months_paid = 1
```

**Day 45: Juan makes another payment**
```
POST /api/loans/1/payment
{
  "payment_amount": 18332.50
}

Response: Payment recorded, months_paid = 2
```

**After 24 months: Loan auto-completes**
```
Status changes from "active" to "completed"
end_date is set to current timestamp
```

---

## 📊 **SQL Examples**

### **See all items in a loan**
```sql
SELECT li.*, i.name, i.price
FROM loan_items li
JOIN items i ON li.item_id = i.item_id
WHERE li.loan_id = 1;
```

### **Calculate total for a loan**
```sql
SELECT 
  l.loan_id,
  SUM(li.item_price * li.quantity) as total,
  COUNT(li.item_id) as item_count
FROM loans l
JOIN loan_items li ON l.loan_id = li.loan_id
WHERE l.loan_id = 1
GROUP BY l.loan_id;
```

### **See all loans with item count for a user**
```sql
SELECT 
  l.loan_id,
  l.status,
  COUNT(li.item_id) as items,
  GROUP_CONCAT(i.name) as item_names
FROM loans l
LEFT JOIN loan_items li ON l.loan_id = li.loan_id
LEFT JOIN items i ON li.item_id = i.item_id
WHERE l.user_id = 1
GROUP BY l.loan_id;
```

### **See payment progress**
```sql
SELECT 
  l.loan_id,
  l.monthly_payment,
  l.months_paid,
  l.term_months,
  l.paid_amount,
  l.total_amount,
  (l.total_amount - l.paid_amount) as remaining
FROM loans l
WHERE l.user_id = 1;
```

---

## ✅ **Key Features**

| Feature | Behavior |
|---------|----------|
| **Items per loan** | Unlimited (1 to Many) |
| **Payment** | One payment per loan (covers all items) |
| **Payment schedule** | Generated for entire loan term |
| **Item price** | Captured at purchase time (won't change later) |
| **Interest rate** | Applied to total of all items |
| **Multiple loans** | User can have many loans simultaneously |

---

## 🧪 **Testing**

### **Test 1: Create loan with 2 items**
```bash
curl -X POST http://localhost:3000/api/loans/create \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "interest_rate": 12,
    "term_months": 12,
    "items": [
      {"item_id": 1, "quantity": 1},
      {"item_id": 5, "quantity": 1}
    ]
  }'
```

### **Test 2: View loan with items**
```bash
curl http://localhost:3000/api/loans/1
```

### **Test 3: Record payment**
```bash
curl -X POST http://localhost:3000/api/loans/1/payment \
  -H "Content-Type: application/json" \
  -d '{"payment_amount": 18000}'
```

### **Test 4: View user's loans**
```bash
curl http://localhost:3000/api/loans/user/1
```

### **Test 5: Update status**
```bash
curl -X PUT http://localhost:3000/api/loans/1/status \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

---

## 🚀 **Setup**

```bash
# Delete old database
mysql -u root -p -e "DROP DATABASE loanease_ph;"

# Create new database with loan_items table
mysql -u root -p < database/database.sql

# Restart server
npm run dev
```

---

## 📈 **How Payment Calculation Works**

When creating a loan with multiple items:

1. **Sum all item costs** (price × quantity)
   - iPhone: ₱129,990 × 1 = ₱129,990
   - Samsung: ₱89,990 × 1 = ₱89,990
   - **Total: ₱219,980**

2. **Calculate monthly payment** using amortization
   - Interest rate: 12% annual
   - Term: 12 months
   - **Monthly payment: ₱18,331.67**

3. **Total with interest** (monthly × months)
   - ₱18,331.67 × 12 = ₱219,980

4. **Create 12 payment schedules** (one per month)
   - Each month: ₱18,331.67 due
   - Principal portion increases each month
   - Interest portion decreases each month

---

## ✨ **Advantages of This Design**

✅ **One loan, many items** - User doesn't need multiple loans  
✅ **Single monthly payment** - Simpler for users  
✅ **Fair pricing** - Interest calculated on total  
✅ **Flexibility** - Can mix phones, cars, appliances, etc.  
✅ **Easy tracking** - All items grouped in one loan  

---

**Loan Items System Ready!** ✅

Your database now supports multiple items in a single loan with separate item tracking.
