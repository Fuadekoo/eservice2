-- MySQL Authentication Plugin Fix Script
-- Run this script as root user to fix the authentication plugin issue

-- Option 1: Change existing user to use mysql_native_password
-- Replace 'your_username' and 'your_password' with actual values
ALTER USER 'your_username'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;

-- Option 2: Create a new user for Prisma with mysql_native_password
-- Uncomment and modify the lines below if you want to create a new user

-- CREATE USER 'prisma_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_secure_password';
-- GRANT ALL PRIVILEGES ON mydb.* TO 'prisma_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Check the authentication plugin for your users
SELECT user, host, plugin FROM mysql.user WHERE user LIKE '%your_username%' OR user LIKE '%prisma%';

