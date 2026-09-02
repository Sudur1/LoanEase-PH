-- LoanEase PH Database Schema
-- Created for the lending/BNPL application

-- ==========================================
-- AGENTS TABLE (Companies/Sellers Providing Items)
-- ==========================================
CREATE TABLE agents (
    agent_id INT AUTO_INCREMENT PRIMARY KEY,
    agent_name VARCHAR(150) NOT NULL UNIQUE,
    description TEXT,
    logo_url VARCHAR(255),  -- URL to agent logo/image
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    website VARCHAR(255),
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_agent_name (agent_name),
    INDEX idx_status (status)
);

-- ==========================================
-- USERS TABLE (Login Information)
-- ==========================================
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,  -- Store hashed passwords only

    -- Personal Information
    birth_date DATE,
    gender ENUM('male', 'female', 'other'),
    address VARCHAR(255),
    city VARCHAR(100),
    province VARCHAR(100),
    zip_code VARCHAR(10),

    -- Financial Information
    monthly_income DECIMAL(10, 2),
    employment_status VARCHAR(50),  -- employed, self-employed, freelancer, etc.
    other_debts DECIMAL(10, 2) DEFAULT 0,
    credit_limit DECIMAL(12, 2) DEFAULT 0,
    used_credit DECIMAL(12, 2) DEFAULT 0,
    credit_score INT DEFAULT 650,

    -- Employment Information
    job_title VARCHAR(100),
    company_name VARCHAR(100),
    years_employed DECIMAL(3, 1),

    -- Account Status
    status ENUM('pending', 'verified', 'suspended') DEFAULT 'pending',
    account_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    account_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_email (email),
    INDEX idx_status (status)
);

-- ==========================================
-- ITEMS TABLE (Products Available for Loan)
-- ==========================================
CREATE TABLE items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    agent_id INT NOT NULL,  -- Foreign key to agents table
    category VARCHAR(50) NOT NULL,  -- phones, tv, appliances, gadgets, cars
    name VARCHAR(150) NOT NULL,
    specs VARCHAR(255),  -- Product specifications
    price DECIMAL(12, 2) NOT NULL,
    emoji VARCHAR(10),  -- Emoji representation (📱, 📺, etc.)
    image VARCHAR(255),  -- Image URL/path for product display
    base_interest_rate DECIMAL(5, 2) DEFAULT 12,  -- Base annual interest rate %
    min_credit_score INT DEFAULT 600,  -- Minimum credit score required to borrow

    -- Availability
    in_stock BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE RESTRICT,

    INDEX idx_agent_id (agent_id),
    INDEX idx_category (category),
    INDEX idx_price (price),
    INDEX idx_in_stock (in_stock)
);

-- ==========================================
-- LOANS TABLE (Active and Past Loans - Can contain multiple items)
-- ==========================================
CREATE TABLE loans (
    loan_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,

    -- Loan Details
    loan_amount DECIMAL(12, 2) NOT NULL,  -- Total of all items
    monthly_payment DECIMAL(10, 2) NOT NULL,
    interest_rate DECIMAL(5, 2) NOT NULL,  -- Annual interest rate %
    term_months INT NOT NULL,  -- Number of months
    total_amount DECIMAL(12, 2) NOT NULL,  -- Principal + Interest
    total_items INT NOT NULL,  -- How many items in this loan

    -- Loan Status
    status ENUM('pending', 'approved', 'active', 'completed', 'defaulted') DEFAULT 'pending',
    approval_date DATETIME,
    start_date DATE,
    end_date DATE,

    -- Payment Tracking
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    months_paid INT DEFAULT 0,
    last_payment_date DATETIME,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,

    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_start_date (start_date)
);

-- ==========================================
-- LOAN ITEMS TABLE (Maps items to loans - One loan can have many items)
-- ==========================================
CREATE TABLE loan_items (
    loan_item_id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT DEFAULT 1,
    item_price DECIMAL(12, 2) NOT NULL,  -- Price at time of purchase

    -- Timestamps
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign Keys
    FOREIGN KEY (loan_id) REFERENCES loans(loan_id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE RESTRICT,

    INDEX idx_loan_id (loan_id),
    INDEX idx_item_id (item_id)
);

-- ==========================================
-- PAYMENT SCHEDULE TABLE (Optional but recommended)
-- ==========================================
CREATE TABLE payment_schedules (
    schedule_id INT AUTO_INCREMENT PRIMARY KEY,
    loan_id INT NOT NULL,
    payment_number INT NOT NULL,
    due_date DATE NOT NULL,
    principal_amount DECIMAL(10, 2),
    interest_amount DECIMAL(10, 2),
    payment_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'paid', 'late', 'missed') DEFAULT 'pending',
    paid_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (loan_id) REFERENCES loans(loan_id) ON DELETE CASCADE,
    INDEX idx_loan_id (loan_id),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status)
);

-- ==========================================
-- AGENTS DATA (Companies Selling Items)
-- ==========================================
INSERT INTO agents (agent_name, description, contact_email, website, status) VALUES
('Apple Philippines', 'Premium smartphones and electronics', 'support@apple.com.ph', 'https://apple.com', 'active'),
('Samsung PH', 'Electronics and home appliances', 'support@samsung.com.ph', 'https://samsung.com', 'active'),
('LG Philippines', 'TVs and appliances', 'support@lg.com.ph', 'https://lg.com', 'active'),
('Sony Philippines', 'Electronics and entertainment', 'support@sony.com.ph', 'https://sony.com', 'active'),
('Google Store PH', 'Google devices and gadgets', 'support@google.com.ph', 'https://google.com', 'active'),
('Xiaomi PH', 'Affordable electronics', 'support@xiaomi.com.ph', 'https://xiaomi.com', 'active'),
('TCL Philippines', 'TVs and smart devices', 'support@tcl.com.ph', 'https://tcl.com', 'active'),
('Daikin PH', 'Air conditioning solutions', 'support@daikin.com.ph', 'https://daikin.com', 'active'),
('Sharp Philippines', 'Home appliances', 'support@sharp.com.ph', 'https://sharp.com', 'active'),
('Panasonic PH', 'Electronics and appliances', 'support@panasonic.com.ph', 'https://panasonic.com', 'active'),
('Toyota PH', 'Vehicles and automotive', 'support@toyota.com.ph', 'https://toyota.com', 'active'),
('Honda PH', 'Vehicles and automotive', 'support@honda.com.ph', 'https://honda.com', 'active'),
('Mitsubishi Motors PH', 'Vehicles and automotive', 'support@mitsubishi.com.ph', 'https://mitsubishi.com', 'active');

-- ==========================================
-- ITEMS DATA (Pre-populated Products)
-- ==========================================

-- PHONES (8 items) - Agent: Apple, Samsung, Google, Xiaomi
INSERT INTO items (agent_id, category, name, specs, price, emoji, image, base_interest_rate, min_credit_score) VALUES
(1, 'phones', 'iPhone 16 Pro Max', '256GB · Desert Titanium', 129990, '📱', 'https://via.placeholder.com/300x300?text=iPhone+16+Pro+Max', 12, 700),
(1, 'phones', 'iPhone 16 Pro', '128GB · Black Titanium', 99990, '📱', 'https://via.placeholder.com/300x300?text=iPhone+16+Pro', 12, 700),
(1, 'phones', 'iPhone 16', '128GB · Ultramarine', 69990, '📱', 'https://via.placeholder.com/300x300?text=iPhone+16', 12, 650),
(1, 'phones', 'iPhone 15', '128GB · Midnight', 59990, '📱', 'https://via.placeholder.com/300x300?text=iPhone+15', 12, 650),
(2, 'phones', 'Samsung Galaxy S25 Ultra', '512GB · Titanium Black', 89990, '📱', 'https://via.placeholder.com/300x300?text=Galaxy+S25+Ultra', 12, 700),
(2, 'phones', 'Samsung Galaxy S25+', '256GB · Icy Blue', 64990, '📱', 'https://via.placeholder.com/300x300?text=Galaxy+S25', 12, 650),
(5, 'phones', 'Google Pixel 9 Pro', '256GB · Obsidian', 74990, '📱', 'https://via.placeholder.com/300x300?text=Pixel+9+Pro', 12, 650),
(6, 'phones', 'Xiaomi 14 Ultra', '512GB · White', 54990, '📱', 'https://via.placeholder.com/300x300?text=Xiaomi+14', 12, 600);

-- TVs (4 items) - Agent: Samsung, LG, Sony, TCL
INSERT INTO items (agent_id, category, name, specs, price, emoji, image, base_interest_rate, min_credit_score) VALUES
(2, 'tv', 'Samsung Neo QLED 75"', '8K · Smart TV · 2025', 149990, '📺', 'https://via.placeholder.com/300x300?text=Samsung+QLED', 12, 700),
(3, 'tv', 'LG OLED C4 65"', '4K OLED · webOS · ATSC 3.0', 89990, '📺', 'https://via.placeholder.com/300x300?text=LG+OLED', 12, 700),
(4, 'tv', 'Sony Bravia 7 55"', '4K Mini-LED · Google TV', 74990, '📺', 'https://via.placeholder.com/300x300?text=Sony+Bravia', 12, 700),
(7, 'tv', 'TCL QM8 50"', '4K QLED · Google TV · 144Hz', 34990, '📺', 'https://via.placeholder.com/300x300?text=TCL+QM8', 12, 600);

-- APPLIANCES (5 items) - Agent: LG, Samsung, Daikin, Sharp, Panasonic
INSERT INTO items (agent_id, category, name, specs, price, emoji, image, base_interest_rate, min_credit_score) VALUES
(3, 'appliances', 'LG French Door Ref', '636L · InstaView · Ice & Water', 89990, '🧊', 'https://via.placeholder.com/300x300?text=LG+Refrigerator', 12, 650),
(2, 'appliances', 'Samsung Front Load Washer', '12kg · AI Wash · Steam', 49990, '🫧', 'https://via.placeholder.com/300x300?text=Samsung+Washer', 12, 620),
(8, 'appliances', 'Daikin Inverter AC 2HP', 'Cooling & Heating · 5-star', 44990, '❄️', 'https://via.placeholder.com/300x300?text=Daikin+AC', 12, 620),
(9, 'appliances', 'Sharp Microwave Oven', '42L · Grill · Convection', 12990, '🍲', 'https://via.placeholder.com/300x300?text=Sharp+Microwave', 12, 600),
(10, 'appliances', 'Panasonic Air Purifier', 'PM2.5 Sensor · Nanoe-X', 18990, '💨', 'https://via.placeholder.com/300x300?text=Panasonic+Air+Purifier', 12, 610);

-- GADGETS (4 items) - Agent: Apple, Google, Sony
INSERT INTO items (agent_id, category, name, specs, price, emoji, image, base_interest_rate, min_credit_score) VALUES
(1, 'gadgets', 'MacBook Air M3 15"', '16GB RAM · 512GB SSD', 104990, '💻', 'https://via.placeholder.com/300x300?text=MacBook+Air', 12, 700),
(1, 'gadgets', 'iPad Pro M4 13"', '256GB · Wi-Fi + Cellular', 94990, '📟', 'https://via.placeholder.com/300x300?text=iPad+Pro', 12, 700),
(4, 'gadgets', 'Sony PlayStation 5 Slim', '1TB · Disc Edition', 27990, '🎮', 'https://via.placeholder.com/300x300?text=PlayStation+5', 12, 650),
(4, 'gadgets', 'Sony A7C II Camera', '33MP · Full Frame · 4K', 119990, '📷', 'https://via.placeholder.com/300x300?text=Sony+Camera', 12, 750);

-- CARS (3 items) - Agent: Toyota, Honda, Mitsubishi
INSERT INTO items (agent_id, category, name, specs, price, emoji, image, base_interest_rate, min_credit_score) VALUES
(11, 'cars', 'Toyota Vios 1.3 XLE CVT', '2025 · Petrol · Sedan', 895000, '🚗', 'https://via.placeholder.com/300x300?text=Toyota+Vios', 12, 750),
(12, 'cars', 'Honda City RS e:HEV', '2025 · Hybrid · Sedan', 1289000, '🚙', 'https://via.placeholder.com/300x300?text=Honda+City', 12, 750),
(13, 'cars', 'Mitsubishi Xpander GLS AT', '2025 · 1.5L · 7-seater', 1098000, '🚐', 'https://via.placeholder.com/300x300?text=Mitsubishi+Xpander', 12, 750);

-- ==========================================
-- Verification Queries (Run these to verify)
-- ==========================================
-- View all items with agent info:
-- SELECT i.item_id, a.agent_name, i.category, i.name, i.price FROM items i JOIN agents a ON i.agent_id = a.agent_id ORDER BY i.category;

-- View all agents:
-- SELECT * FROM agents;

-- Count items by category:
-- SELECT category, COUNT(*) as count FROM items GROUP BY category;

-- Check total items:
-- SELECT COUNT(*) as total_items FROM items;

-- Example: Check if a user can have multiple loans
-- SELECT COUNT(*) as total_loans FROM loans WHERE user_id = 1;
