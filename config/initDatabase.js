// ==========================================
// Database Auto-Initialization
// Creates tables and seeds initial data if database is empty.
// Runs every time the server starts, but is safe to run repeatedly
// (uses CREATE TABLE IF NOT EXISTS and seeds only when tables are empty).
// ==========================================

const pool = require('./db');

async function createTables(connection) {
  // AGENTS
  await connection.query(`
    CREATE TABLE IF NOT EXISTS agents (
      agent_id INT AUTO_INCREMENT PRIMARY KEY,
      agent_name VARCHAR(150) NOT NULL UNIQUE,
      description TEXT,
      logo_url VARCHAR(255),
      contact_email VARCHAR(100),
      contact_phone VARCHAR(20),
      website VARCHAR(255),
      status ENUM('active', 'inactive') DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_agent_name (agent_name),
      INDEX idx_status (status)
    )
  `);

  // USERS
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INT AUTO_INCREMENT PRIMARY KEY,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      phone VARCHAR(20) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      birth_date DATE,
      gender ENUM('male', 'female', 'other'),
      address VARCHAR(255),
      city VARCHAR(100),
      province VARCHAR(100),
      zip_code VARCHAR(10),
      monthly_income DECIMAL(10, 2),
      other_debts DECIMAL(10, 2) DEFAULT 0,
      credit_limit DECIMAL(12, 2) DEFAULT 0,
      used_credit DECIMAL(12, 2) DEFAULT 0,
      credit_score INT DEFAULT 650,
      job_title VARCHAR(100),
      company_name VARCHAR(100),
      years_employed DECIMAL(3, 1),
      status ENUM('pending', 'verified', 'suspended') DEFAULT 'pending',
      account_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      account_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_status (status)
    )
  `);

  // ITEMS
  await connection.query(`
    CREATE TABLE IF NOT EXISTS items (
      item_id INT AUTO_INCREMENT PRIMARY KEY,
      agent_id INT NOT NULL,
      category VARCHAR(50) NOT NULL,
      name VARCHAR(150) NOT NULL,
      specs VARCHAR(255),
      price DECIMAL(12, 2) NOT NULL,
      emoji VARCHAR(10),
      image VARCHAR(255),
      base_interest_rate DECIMAL(5, 2) DEFAULT 12,
      min_credit_score INT DEFAULT 600,
      in_stock BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (agent_id) REFERENCES agents(agent_id) ON DELETE RESTRICT,
      INDEX idx_agent_id (agent_id),
      INDEX idx_category (category),
      INDEX idx_price (price),
      INDEX idx_in_stock (in_stock)
    )
  `);

  // LOANS
  await connection.query(`
    CREATE TABLE IF NOT EXISTS loans (
      loan_id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      loan_amount DECIMAL(12, 2) NOT NULL,
      monthly_payment DECIMAL(10, 2) NOT NULL,
      interest_rate DECIMAL(5, 2) NOT NULL,
      term_months INT NOT NULL,
      total_amount DECIMAL(12, 2) NOT NULL,
      total_items INT NOT NULL,
      status ENUM('pending', 'approved', 'active', 'completed', 'defaulted') DEFAULT 'pending',
      approval_date DATETIME,
      start_date DATE,
      end_date DATE,
      paid_amount DECIMAL(12, 2) DEFAULT 0,
      months_paid INT DEFAULT 0,
      last_payment_date DATETIME,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
      INDEX idx_user_id (user_id),
      INDEX idx_status (status),
      INDEX idx_start_date (start_date)
    )
  `);

  // LOAN ITEMS (links items to loans, allows multiple items per loan)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS loan_items (
      loan_item_id INT AUTO_INCREMENT PRIMARY KEY,
      loan_id INT NOT NULL,
      item_id INT NOT NULL,
      quantity INT DEFAULT 1,
      item_price DECIMAL(12, 2) NOT NULL,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (loan_id) REFERENCES loans(loan_id) ON DELETE CASCADE,
      FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE RESTRICT,
      INDEX idx_loan_id (loan_id),
      INDEX idx_item_id (item_id)
    )
  `);

  // PAYMENT SCHEDULES
  await connection.query(`
    CREATE TABLE IF NOT EXISTS payment_schedules (
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
    )
  `);

  // ===== MIGRATIONS for existing databases =====
  // Add credit_limit / used_credit / credit_score if missing (safe for fresh AND existing DBs)
  const [colCheck] = await connection.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
       AND COLUMN_NAME IN ('credit_limit', 'used_credit', 'credit_score')`
  );
  const existingCols = colCheck.map(c => c.COLUMN_NAME);
  if (!existingCols.includes('credit_limit')) {
    await connection.query(`ALTER TABLE users ADD COLUMN credit_limit DECIMAL(12, 2) DEFAULT 0 AFTER other_debts`);
    console.log('🔧 Added credit_limit column to users');
  }
  if (!existingCols.includes('used_credit')) {
    await connection.query(`ALTER TABLE users ADD COLUMN used_credit DECIMAL(12, 2) DEFAULT 0 AFTER credit_limit`);
    console.log('🔧 Added used_credit column to users');
  }
  if (!existingCols.includes('credit_score')) {
    await connection.query(`ALTER TABLE users ADD COLUMN credit_score INT DEFAULT 650 AFTER used_credit`);
    console.log('🔧 Added credit_score column to users');
  }

  // Add min_credit_score to items if missing
  const [itemColCheck] = await connection.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'items'
       AND COLUMN_NAME = 'min_credit_score'`
  );
  if (itemColCheck.length === 0) {
    await connection.query(`ALTER TABLE items ADD COLUMN min_credit_score INT DEFAULT 600 AFTER base_interest_rate`);
    console.log('🔧 Added min_credit_score column to items');
  }

  console.log('✅ All tables verified/created');
}

async function seedAgents(connection) {
  const [existing] = await connection.query('SELECT COUNT(*) as cnt FROM agents');
  if (existing[0].cnt > 0) {
    console.log(`ℹ️  Agents already seeded (${existing[0].cnt} rows) — skipping`);
    return;
  }

  const agents = [
    ['Apple Philippines', 'Premium smartphones and electronics', 'support@apple.com.ph', 'https://apple.com'],
    ['Samsung PH', 'Electronics and home appliances', 'support@samsung.com.ph', 'https://samsung.com'],
    ['LG Philippines', 'TVs and appliances', 'support@lg.com.ph', 'https://lg.com'],
    ['Sony Philippines', 'Electronics and entertainment', 'support@sony.com.ph', 'https://sony.com'],
    ['Google Store PH', 'Google devices and gadgets', 'support@google.com.ph', 'https://google.com'],
    ['Xiaomi PH', 'Affordable electronics', 'support@xiaomi.com.ph', 'https://xiaomi.com'],
    ['TCL Philippines', 'TVs and smart devices', 'support@tcl.com.ph', 'https://tcl.com'],
    ['Daikin PH', 'Air conditioning solutions', 'support@daikin.com.ph', 'https://daikin.com'],
    ['Sharp Philippines', 'Home appliances', 'support@sharp.com.ph', 'https://sharp.com'],
    ['Panasonic PH', 'Electronics and appliances', 'support@panasonic.com.ph', 'https://panasonic.com'],
    ['Toyota PH', 'Vehicles and automotive', 'support@toyota.com.ph', 'https://toyota.com'],
    ['Honda PH', 'Vehicles and automotive', 'support@honda.com.ph', 'https://honda.com'],
    ['Mitsubishi Motors PH', 'Vehicles and automotive', 'support@mitsubishi.com.ph', 'https://mitsubishi.com']
  ];

  for (const [name, desc, email, web] of agents) {
    await connection.query(
      `INSERT INTO agents (agent_name, description, contact_email, website, status)
       VALUES (?, ?, ?, ?, 'active')`,
      [name, desc, email, web]
    );
  }
  console.log(`✅ Seeded ${agents.length} agents`);
}

async function seedItems(connection) {
  const [existing] = await connection.query('SELECT COUNT(*) as cnt FROM items');
  if (existing[0].cnt > 0) {
    console.log(`ℹ️  Items already seeded (${existing[0].cnt} rows) — skipping`);
    return;
  }

  const items = [
    // [agent_id, category, name, specs, price, emoji, image_placeholder_text, min_credit_score]
    // PHONES - Premium (700), Standard (650), Budget (600)
    [1, 'phones', 'iPhone 16 Pro Max', '256GB · Desert Titanium', 129990, '📱', 'iPhone+16+Pro+Max', 700],
    [1, 'phones', 'iPhone 16 Pro', '128GB · Black Titanium', 99990, '📱', 'iPhone+16+Pro', 700],
    [1, 'phones', 'iPhone 16', '128GB · Ultramarine', 69990, '📱', 'iPhone+16', 650],
    [1, 'phones', 'iPhone 15', '128GB · Midnight', 59990, '📱', 'iPhone+15', 650],
    [2, 'phones', 'Samsung Galaxy S25 Ultra', '512GB · Titanium Black', 89990, '📱', 'Galaxy+S25+Ultra', 700],
    [2, 'phones', 'Samsung Galaxy S25+', '256GB · Icy Blue', 64990, '📱', 'Galaxy+S25', 650],
    [5, 'phones', 'Google Pixel 9 Pro', '256GB · Obsidian', 74990, '📱', 'Pixel+9+Pro', 650],
    [6, 'phones', 'Xiaomi 14 Ultra', '512GB · White', 54990, '📱', 'Xiaomi+14', 600],
    // TVs - Premium (700), Standard (650), Budget (600)
    [2, 'tv', 'Samsung Neo QLED 75"', '8K · Smart TV · 2025', 149990, '📺', 'Samsung+QLED', 700],
    [3, 'tv', 'LG OLED C4 65"', '4K OLED · webOS · ATSC 3.0', 89990, '📺', 'LG+OLED', 700],
    [4, 'tv', 'Sony Bravia 7 55"', '4K Mini-LED · Google TV', 74990, '📺', 'Sony+Bravia', 700],
    [7, 'tv', 'TCL QM8 50"', '4K QLED · Google TV · 144Hz', 34990, '📺', 'TCL+QM8', 600],
    // APPLIANCES - Standard (620)
    [3, 'appliances', 'LG French Door Ref', '636L · InstaView · Ice & Water', 89990, '🧊', 'LG+Refrigerator', 650],
    [2, 'appliances', 'Samsung Front Load Washer', '12kg · AI Wash · Steam', 49990, '🫧', 'Samsung+Washer', 620],
    [8, 'appliances', 'Daikin Inverter AC 2HP', 'Cooling & Heating · 5-star', 44990, '❄️', 'Daikin+AC', 620],
    [9, 'appliances', 'Sharp Microwave Oven', '42L · Grill · Convection', 12990, '🍲', 'Sharp+Microwave', 600],
    [10, 'appliances', 'Panasonic Air Purifier', 'PM2.5 Sensor · Nanoe-X', 18990, '💨', 'Panasonic+Air+Purifier', 610],
    // GADGETS - Premium (700), Standard (650)
    [1, 'gadgets', 'MacBook Air M3 15"', '16GB RAM · 512GB SSD', 104990, '💻', 'MacBook+Air', 700],
    [1, 'gadgets', 'iPad Pro M4 13"', '256GB · Wi-Fi + Cellular', 94990, '📟', 'iPad+Pro', 700],
    [4, 'gadgets', 'Sony PlayStation 5 Slim', '1TB · Disc Edition', 27990, '🎮', 'PlayStation+5', 650],
    [4, 'gadgets', 'Sony A7C II Camera', '33MP · Full Frame · 4K', 119990, '📷', 'Sony+Camera', 750],
    // CARS - High-end (750)
    [11, 'cars', 'Toyota Vios 1.3 XLE CVT', '2025 · Petrol · Sedan', 895000, '🚗', 'Toyota+Vios', 750],
    [12, 'cars', 'Honda City RS e:HEV', '2025 · Hybrid · Sedan', 1289000, '🚙', 'Honda+City', 750],
    [13, 'cars', 'Mitsubishi Xpander GLS AT', '2025 · 1.5L · 7-seater', 1098000, '🚐', 'Mitsubishi+Xpander', 750]
  ];

  for (const [agentId, cat, name, specs, price, emoji, imgText, minCreditScore] of items) {
    const image = `https://via.placeholder.com/300x300?text=${imgText}`;
    await connection.query(
      `INSERT INTO items (agent_id, category, name, specs, price, emoji, image, base_interest_rate, min_credit_score, in_stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, 12, ?, true)`,
      [agentId, cat, name, specs, price, emoji, image, minCreditScore]
    );
  }
  console.log(`✅ Seeded ${items.length} items`);
}

async function initDatabase() {
  console.log('🔧 Initializing database schema...');
  const connection = await pool.getConnection();
  try {
    await createTables(connection);
    await seedAgents(connection);
    await seedItems(connection);
    console.log('🎉 Database initialization complete\n');
  } finally {
    connection.release();
  }
}

module.exports = { initDatabase };
