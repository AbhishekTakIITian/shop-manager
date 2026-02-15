// src/main/db.js
import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import { error } from 'console';

// 1. Define the location of the database file
// We use app.getPath('userData') so the OS allows us to write here
const dbPath = path.join(app.getPath('userData'), 'shop.db');

// 2. Open the database (it creates the file if it doesn't exist)
const db = new Database(dbPath);
db.pragma('journal_mode = WAL'); // Improves performance
db.pragma('foreign_keys = ON'); // Enforce foreign key constraints

export function initDB() {
  // Create Users Table
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `;
  const createCustomersTable = `
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      landMark TEXT,
      imagePath TEXT,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    );
  `;
  const createLoansTable = `
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loanId TEXT NOT NULL,
      customerId INTEGER NOT NULL,
      amount REAL NOT NULL,
      interestRate REAL NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      jewelleryName TEXT NOT NULL,
      description TEXT,
      jewelleryValue REAL,
      status TEXT NOT NULL,
      FOREIGN KEY (customerId) REFERENCES customers(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS completedLoans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loanId INTEGER NOT NULL,
      paidDate TEXT,
      paidAmount REAL,
      paidInterest REAL,
      FOREIGN KEY (loanId) REFERENCES loans(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS loanImages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loanId INTEGER NOT NULL,
      imagePath TEXT NOT NULL,
      FOREIGN KEY (loanId) REFERENCES loans(id) ON DELETE CASCADE ON UPDATE CASCADE
    );
  `;

  const createPushkrajTable = `
    CREATE TABLE IF NOT EXISTS pushkrajFirms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      foreign KEY (userId) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE
    );
    
    CREATE TABLE IF NOT EXISTS pushkrajLoans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firmId INTEGER NOT NULL,
      amount REAL NOT NULL,
      startDate TEXT NOT NULL,
      jewelleryNameNo TEXT NOT NULL,
      customerName TEXT NOT NULL,
      FOREIGN KEY (firmId) REFERENCES pushkrajFirms(id) ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE TABLE IF NOT EXISTS pushkrajCompletedLoans(
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loanId INTEGER NOT NULL,
      paidDate TEXT NOT NULL,
      paidAmount REAL NOT NULL,
      paidInterest REAL NOT NULL,
      foreign KEY (loanId) REFERENCES pushkrajLoans(id) ON DELETE CASCADE ON UPDATE CASCADE
    );
  `;




  db.exec(createUsersTable);
  db.exec(createCustomersTable);
  db.exec(createLoansTable);
  db.exec(createPushkrajTable);

  console.log('Database initialized. Created tables if they did not exist.');
  // 4. Create a Default Admin User (so you can log in immediately)
  // We check if the table is empty first
  const stmt = db.prepare('SELECT count(*) as count FROM users');
  const result = stmt.get();


  if (result.count === 0) {
    console.log('Creating default admin user...');
    const insert = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    // WARNING: In production, you should hash passwords (using bcrypt). 
    // For this learning step, we are storing plain text '1234'.
    insert.run('amol', 'ass');
  }
}

// 5. Function to Check Login
export function loginUser(credentials) {
  const stmt = db.prepare('SELECT * FROM users WHERE username = @username');
  const user = stmt.get(credentials);

  // If user not found
  if (!user) return { success: false, message: 'User not found' };

  // Check password (simple comparison)
  if (user.password === credentials.password) {
    return { success: true, message: 'Login successful', user: { username: user.username, userId: user.id}, };
  } else {
    return { success: false, message: 'Invalid password' };
  }
}

export function getAllCustomers(userId){
  const stmt = db.prepare(`SELECT * FROM customers WHERE userId = ?`)
  const values = stmt.all(userId);
  return values;
}


export function createCustomer(customerData){
  const stmt = db.prepare(`
    INSERT INTO customers (userId, name, phone, address, landMark, image) 
    VALUES (@userId,@name, @phone, @address, @landMark, @image);
  `);
  try{
    const info = stmt.run(customerData);
    return { success: true, id: info.lastInsertRowid };
  }catch (e){
    return {success: false, message:`Error creating customer, error: ${e.message}`};
  }
  
}

export function updateCustomer(customerData){
  const stmt = db.prepare(`
    UPDATE customers 
    SET name = @name, phone = @phone, address = @address, landMark = @landMark, image = @image
    WHERE id = @id;
  `);
  try{
    const info = stmt.run(customerData);
    return { success: true};
  }catch (e){
    return {success: false, message:`Error updating customer, error: ${e.message}`};
  }
  
}

export function deleteCustomer(customerId){
  const stmt = db.prepare(`DELETE FROM customers WHERE id = ?`);
  try{
    const info = stmt.run(customerId);
    return { success: true};
  }catch (e){
    return {success: false, message:`Error deleting customer, error: ${e.message}`};
  }
}

export function addLoan(loanData){
  const stmt  = db.prepare(`INSERT INTO loans 
    (loanId, customerId, amount, interestRate, startDate, endDate, jewelleryName, description, jewelleryValue, netWeight, fineWeight, status)
    VALUES
    (@loanId, @customerId, @loanAmount, @interestRate, @loanDate, @dueDate, @jewelleryName, @jewelleryDetails, @valuation, @netWeight, @fineWeight, 'active');
  `);  
  const stmt1 = db.prepare(`INSERT INTO loanImages (loanId, imagePath) VALUES (@loanId, @imagePath);`);
  const insertLoanWithImages = db.transaction((loanDetails, images) => {
    const loanInfo = stmt.run(loanDetails);
    const loanId = loanInfo.lastInsertRowid;
    console.log('Inserted loan with ID:', loanId)
    const imageIds = [];
    if (images && images.length) {
      for (const img of images) {
        // Skip null/undefined/empty image entries to avoid NOT NULL constraint failures
        if (!img) continue;
        const info = stmt1.run({ loanId: loanId, imagePath: img });
        imageIds.push(info.lastInsertRowid);
      }
    }
    return { loanId, imageIds };
  });

  const {loanDetails, imagePaths} = loanData;
  console.log('Adding loan with details:', loanDetails, 'and images:', imagePaths)
  const sanitizedLoan = {
        loanId: loanData.loanId,
        customerId: loanData.customerId,
        loanAmount: loanData.loanAmount,
        interestRate: loanData.interestRate,
        loanDate: loanData.loanDate,
        dueDate: loanData.dueDate,
        jewelleryName: loanData.jewelleryName,
        jewelleryDetails: loanData.jewelleryDetails, // Mapped to @jewelleryDetails
        valuation: loanData.valuation,
        netWeight: loanData.netWeight,
        fineWeight: loanData.fineWeight
    };
  try {
    const result = insertLoanWithImages(sanitizedLoan, imagePaths);
    return { success: true, loanId: result.loanId, imageIds: result.imageIds };
  } catch (e) {
    return { success: false, message: `Error adding loan: ${e.message}` };
  }
}

export function getLoanDetails(payload){
  return {success: true, data: []}
}


