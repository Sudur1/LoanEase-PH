# Database Schema Updates - Multiple Loans & Agent System

This document explains the database updates made to support multiple loans per user and a proper agent/seller system.

---

## 📋 What Changed

### 1. **New Agents Table**
**Purpose:** Track which company/seller is providing each item

```sql
CREATE TABLE agents (
    agent_id INT AUTO_INCREMENT PRIMARY KEY,
    agent_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    logo_url VARCHAR(255),
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    website VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Pre-loaded Agents (13 total):**
- Apple Philippines
- Samsung PH
- LG Philippines
- Sony Philippines
- Google Store PH
- Xiaomi PH
- TCL Philippines
- Daikin PH
- Sharp Philippines
- Panasonic PH
- Toyota PH
- Honda PH
- Mitsubishi Motors PH

**When to Use:**
- When displaying products, show which company is providing it
- Track which agent receives payment
- Different agents = different interest rates in future

---

### 2. **Items Table Updates**

**Added Columns:**
```sql
agent_id INT NOT NULL          -- Foreign key to agents table
image VARCHAR(255)             -- URL/path to product image
```

**Updated Foreign Keys:**
```sql
FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE RESTRICT
```

**Example Items Now Look Like:**
```
Item: iPhone 16 Pro Max
Agent: Apple Philippines
Price: ₱129,990
Image: https://via.placeholder.com/300x300?text=iPhone+16+Pro+Max
```

---

### 3. **Multiple Loans Per User** ✅

The loans table **already supported multiple loans per user** before the update. Here's why:

**Current Schema:**
```sql
CREATE TABLE loans (
    loan_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    ...
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
```

**Why This Allows Multiple Loans:**
- `loan_id` is the PRIMARY KEY (unique per loan)
- There's **NO unique constraint on (user_id, item_id)**
- A user can have multiple loans for:
  - **Same item:** User buys iPhone multiple times (different units)
  - **Different items:** User borrows iPhone AND Samsung phone AND refrigerator

**Example Data:**
```
user_id=1 → loan_id=1 (iPhone 16 Pro Max)
user_id=1 → loan_id=2 (Samsung Galaxy S25)
user_id=1 → loan_id=3 (Daikin AC)
user_id=1 → loan_id=4 (Honda City)
```

**Verify in Database:**
```sql
-- Count how many loans a user has
SELECT user_id, COUNT(*) as loan_count
FROM loans
GROUP BY user_id;

-- See all loans for user_id=1
SELECT * FROM loans WHERE user_id = 1;
```

---

## 🗄️ Updated Database Relationships

```
agents (13 sellers)
    ↓
items (24 products with agent_id)
    ↓
loans (multiple per user)
    ↓
payment_schedules (tracks each monthly payment)

users can have many loans
each loan has one agent
each item has one agent
```

---

## 🔄 API Updates

### Items Endpoints Now Return Agent Info

**GET /api/items**
```json
{
  "success": true,
  "count": 24,
  "data": [
    {
      "item_id": 1,
      "agent_id": 1,
      "agent_name": "Apple Philippines",
      "agent_website": "https://apple.com",
      "category": "phones",
      "name": "iPhone 16 Pro Max",
      "specs": "256GB · Desert Titanium",
      "price": 129990,
      "emoji": "📱",
      "image": "https://via.placeholder.com/300x300?text=iPhone+16+Pro+Max",
      "base_interest_rate": 12,
      "in_stock": true
    }
  ]
}
```

### Create Item Now Requires agent_id

**POST /api/items**
```json
{
  "agent_id": 1,
  "category": "phones",
  "name": "iPhone 17",
  "specs": "512GB · Gold",
  "price": 149990,
  "emoji": "📱",
  "image": "https://example.com/iphone17.jpg",
  "base_interest_rate": 12
}
```

---

## 📝 Migration Steps

### If You Have Existing Data:

**1. Back up your current database:**
```bash
mysqldump -u root -p loanease_ph > backup_old.sql
```

**2. Drop the old database:**
```bash
mysql -u root -p -e "DROP DATABASE loanease_ph;"
```

**3. Create new database with updated schema:**
```bash
mysql -u root -p < database/database.sql
```

### If This is Your First Setup:
Just run the new database.sql file as usual:
```bash
mysql -u root -p < database/database.sql
```

---

## 💡 How This Works in Practice

### User Scenario: Juan wants to buy multiple items

**Step 1: Juan browses items**
```
GET /api/items
↓
Returns 24 items, each with agent_name showing:
- iPhone 16 Pro Max (Apple Philippines)
- Samsung Galaxy S25 (Samsung PH)
- Daikin AC (Daikin PH)
- Toyota Vios (Toyota PH)
```

**Step 2: Juan applies for iPhone**
- Submits loan application for iPhone (agent_id=1, Apple)
- Backend creates: loans entry with user_id=1, item_id=1
- Payment schedule created for 12/18/24 months

**Step 3: Juan later applies for Samsung phone**
- Submits loan application for Samsung (agent_id=2, Samsung PH)
- Backend creates: loans entry with user_id=1, item_id=5
- **First loan still active** - no conflict
- Payment schedule created for Samsung separately

**Step 4: Database shows:**
```sql
SELECT * FROM loans WHERE user_id = 1;
-- Result: 2 loans, both active
```

**Step 5: When Juan pays**
- Each loan has separate monthly payments
- Can pay iPhone loan AND Samsung loan independently
- Payment schedules tracked separately per loan

---

## 📊 Data Integrity

### What's Protected:

1. **Agent Referential Integrity**
   - Cannot create item without valid agent
   - Cannot delete agent with items (ON DELETE RESTRICT)

2. **Multiple Loans Allowed**
   - User can have unlimited loans
   - Each loan tracked separately
   - No conflicts or overwrites

3. **Image URLs**
   - Optional field (can be null)
   - Supports placeholders (for now)
   - Ready for real image URLs

---

## 🔍 Testing the New System

### Test 1: Check Agents
```sql
SELECT COUNT(*) FROM agents;  -- Should be 13
SELECT * FROM agents WHERE status = 'active';
```

### Test 2: Check Item-Agent Relationships
```sql
SELECT i.name, a.agent_name, i.image
FROM items i
JOIN agents a ON i.agent_id = a.agent_id
LIMIT 5;
```

### Test 3: Create User & Multiple Loans
```sql
-- Insert test user (via signup API)
-- Insert multiple loans
INSERT INTO loans (user_id, item_id, loan_amount, monthly_payment, interest_rate, term_months, total_amount)
VALUES 
  (1, 1, 129990, 15000, 12, 12, 180000),
  (1, 5, 89990, 8000, 12, 12, 96000),
  (1, 13, 89990, 9000, 12, 12, 108000);

-- Query all loans for user_id=1
SELECT * FROM loans WHERE user_id = 1;
```

### Test 4: API - Get Items with Agents
```bash
curl http://localhost:3000/api/items
# Returns all items with agent_name and agent_website
```

### Test 5: API - Create Item with Agent
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": 1,
    "category": "phones",
    "name": "iPhone 17 Pro",
    "specs": "1TB · Titanium",
    "price": 159990,
    "emoji": "📱",
    "image": "https://example.com/iphone17.jpg",
    "base_interest_rate": 10
  }'
```

---

## 📚 Next Steps for Your App

### Frontend Updates Needed:
1. Display agent name with products
2. Show product images (use image field)
3. Allow viewing user's multiple loans on dashboard
4. Show payment schedules per loan

### Backend Features to Add:
1. Agent management endpoints (CRUD for agents)
2. Loan listing per user
3. Separate payment tracking per loan
4. Dashboard endpoint combining user + loans + schedules

### Database Features to Add:
1. Interest rate per agent (not just per item)
2. Commission tracking for agents
3. Loan approval workflow
4. Payment notifications

---

## ✅ Checklist Before Going Live

- [ ] Backup old database (if migrating)
- [ ] Run new database.sql
- [ ] Verify 13 agents created
- [ ] Verify 24 items with images created
- [ ] Test API returns agent_name
- [ ] Test creating item with agent_id
- [ ] Test multiple loans per user in database
- [ ] Update frontend to show images
- [ ] Test full signup → loan application flow

---

## 📞 Troubleshooting

### "Foreign key constraint fails"
- Make sure agent exists before creating item
- Use existing agent_id (1-13)

### "Image not showing"
- Image URLs are placeholders (via.placeholder.com)
- Replace with real image URLs later
- Format: `image` field accepts any URL string

### "Can't create second loan"
- This is normal - loans table supports unlimited loans per user
- Check database: `SELECT COUNT(*) FROM loans WHERE user_id = 1;`

### Items not returning agent_name
- Make sure API was updated (routes/items.js)
- Check SQL JOIN is correct
- Verify agent exists for all items

---

**Database Update Complete!** ✅

Your system now supports:
- ✅ Multiple loans per user
- ✅ Agent/seller tracking
- ✅ Product images
- ✅ Proper referential integrity
