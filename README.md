# LoanEase PH — Setup Guide

This guide provides instructions for setting up and running the complete LoanEase PH application with MySQL database integration.

## 1. Prerequisites

Before starting, make sure the following are installed:

* **Node.js** v24 or later
* **npm**
* **MySQL** 8.0 or later
* Basic command-line knowledge

---

## 2. Quick Start

### Step 1: Install Dependencies

Navigate to the project directory and install the required packages:

```bash
cd /path/to/Victor_App
npm install
```

### Step 2: Create the Database

Open a MySQL client and execute the database script:

```sql
source database/database.sql
```

Alternatively, run the following command from the terminal:

```bash
mysql -u root -p loanease_ph < database/database.sql
```

### Step 3: Start the Server

Start the development server:

```bash
npm run dev
```

A successful startup should display:

```text
Database connected successfully
LoanEase PH Server running on http://localhost:3000
```

### Step 4: Open the Application

Open the following address in your browser:

**http://localhost:3000**

---

## 3. Project Structure

```text
Victor_App/
├── server.js                 # Main Express server
├── config/
│   └── db.js                 # MySQL connection pool
├── routes/
│   ├── auth.js               # Authentication endpoints
│   └── items.js              # Product catalog endpoints
├── database/
│   ├── database.sql          # Database schema and sample data
│   └── README.md             # Database documentation
├── public/
│   ├── index.html             # Homepage
│   ├── items.html             # Product catalog
│   ├── login.html             # Login page
│   ├── signup.html            # Registration page
│   ├── calculator.html        # Loan calculator
│   ├── about.html             # About page
│   ├── contact.html           # Contact page
│   └── css/
│       ├── shared.css
│       ├── index.css
│       └── ...
├── .env                       # Environment configuration
├── package.json               # Project dependencies
└── SETUP_GUIDE.md             # Setup documentation
```

---

## 4. Configuration

Update the `.env` file to match your local MySQL configuration:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=loanease_ph
DB_PORT=3306
PORT=3000
NODE_ENV=development
```

Make sure the database credentials are correct before starting the server.

---

## 5. API Endpoints

### Items

| Method | Endpoint                        | Description                 |
| ------ | ------------------------------- | --------------------------- |
| GET    | `/api/items`                    | Retrieve all in-stock items |
| GET    | `/api/items/:id`                | Retrieve a specific item    |
| GET    | `/api/items/category/:category` | Retrieve items by category  |
| POST   | `/api/items`                    | Create a new item           |

### Authentication

| Method | Endpoint                       | Description              |
| ------ | ------------------------------ | ------------------------ |
| POST   | `/api/auth/signup`             | Register a new user      |
| POST   | `/api/auth/login`              | Authenticate a user      |
| GET    | `/api/auth/check-email/:email` | Check email availability |

### System

| Method | Endpoint      | Description         |
| ------ | ------------- | ------------------- |
| GET    | `/api/health` | Check server status |

---

## 6. Testing the Integration

### Test 1: View Products

1. Open `http://localhost:3000/items.html`.
2. Verify that the product catalog displays the 24 sample products.
3. Test the category filters and search functionality.

### Test 2: Create an Account

1. Open `http://localhost:3000/signup.html`.
2. Complete all four steps of the registration form.
3. Select **Create Account**.
4. Verify that the account was successfully created in the database.

You can verify the account using:

```sql
SELECT * FROM users WHERE email = 'test@email.com';
```

### Test 3: Login

1. Open `http://localhost:3000/login.html`.
2. Enter the email and password used during registration.
3. Verify that the user is redirected to `items.html`.
4. Confirm that the user information is stored in browser `localStorage`.

### Test 4: Add a New Item

Items can be added through an API client such as Postman or through `curl`:

```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "category": "phones",
    "name": "Samsung Galaxy A25",
    "specs": "128GB · Blue",
    "price": 24990,
    "emoji": "📱",
    "base_interest_rate": 12
  }'
```

After successfully adding the item, refresh `items.html` to display the new product.

---

## 7. Troubleshooting

### Error: Cannot find module 'express'

Run:

```bash
npm install
```

### Database Connection Failed

Check the following:

1. Verify that MySQL is running:

```bash
mysql -u root -p
```

2. Verify the database credentials in `.env`.
3. Confirm that the database exists:

```sql
SHOW DATABASES;
```

### Port 3000 Is Already in Use

Change the port in `.env`:

```env
PORT=3001
```

Then restart the server.

### Products Are Not Loading

1. Open the browser developer tools using `F12`.
2. Check the browser console for errors.
3. Verify that the server is running.
4. Open `/api/health` in the browser and confirm that the server responds successfully.

### Users Cannot Sign Up

1. Verify the database configuration in `.env`.
2. Confirm that the `users` table exists:

```sql
DESC users;
```

3. Check the server console for database or SQL errors.

---

## 8. Database Tables

### users

Stores registered user information.

* `user_id` — Primary key
* `first_name`, `last_name` — User information
* `email`, `phone` — Contact information
* `password_hash` — Bcrypt-hashed password
* `birth_date`, `gender`, `address` — Personal information
* `monthly_income`, `employment_status` — Financial and employment information
* `status` — Account status

### items

Stores products available through the application.

* `item_id` — Primary key
* `category` — Product category
* `name`, `specs` — Product information
* `price` — Product price in PHP
* `emoji` — Product display icon
* `base_interest_rate` — Default interest rate
* `in_stock` — Product availability status

### loans

Stores loan information associated with users and products.

* `loan_id` — Primary key
* `user_id` — Foreign key referencing `users`
* `item_id` — Foreign key referencing `items`
* `loan_amount`, `monthly_payment` — Loan financial details
* `interest_rate`, `months` — Loan terms

---

## 9. Development Commands

### Start Development Server

Automatically restarts the server when code changes:

```bash
npm run dev
```

### Start Production Server

```bash
npm start
```

### Install a Package

```bash
npm install package-name
```

### Reset the Database

```bash
mysql -u root -p loanease_ph < database/database.sql
```

---

## 10. Security Considerations

* Passwords are hashed using `bcryptjs` with 10 rounds.
* CORS is currently enabled for all origins for development purposes.
* JWT-based authentication should be implemented for production.
* Database credentials are stored in environment variables.
* Sensitive information should not be hard-coded into the application.

---

## 11. Current Features

The following features have been implemented:

* Frontend pages with a light red and white theme
* MySQL database integration
* Database schema with 24 sample products
* Product catalog API
* Product filtering
* User registration and validation
* User authentication
* Database-backed account management

---

## 12. Recommended Future Features

The following features can be implemented in future development:

* JWT-based session management
* Loan application system
* Payment tracking
* Administrative dashboard
* Email notifications
* SMS verification
* Loan application status tracking
* User loan history

---

## 13. Development Tips

* Keep the server running in one terminal window while using another terminal for commands.
* Use Postman to test API endpoints independently from the frontend.
* Monitor the server console for backend errors.
* Use the browser's Developer Tools and Network tab to inspect API requests and responses.
* Enable MySQL query logging when debugging database-related issues.

---

## 14. Support and Troubleshooting

If an issue occurs, check the following in order:

1. Review the server console for errors.
2. Check the browser console for client-side errors.
3. Verify the `.env` configuration.
4. Confirm that MySQL is running and accessible.
5. Verify that the required database tables exist.
6. Check whether the required port is available.

---

## 15. Getting Started

Once the prerequisites and database configuration are complete, run:

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

The LoanEase PH application should now be running locally.
