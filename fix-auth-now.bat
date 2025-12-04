@echo off
REM Quick Fix Script for MySQL Authentication Plugin Error (Windows)
echo ============================================
echo MySQL Authentication Plugin Fix
echo ============================================
echo.
echo This script will help you fix the sha256_password error.
echo You need to run MySQL commands manually.
echo.
pause

echo.
echo Step 1: Opening MySQL command line...
echo Please run these commands in MySQL:
echo.
echo   1. Connect to MySQL:
echo      mysql -u root -p
echo.
echo   2. Check your users:
echo      SELECT user, host, plugin FROM mysql.user;
echo.
echo   3. Fix the user (replace YOUR_USERNAME and YOUR_PASSWORD):
echo      ALTER USER 'YOUR_USERNAME'@'localhost' IDENTIFIED WITH mysql_native_password BY 'YOUR_PASSWORD';
echo      FLUSH PRIVILEGES;
echo.
echo   4. OR create a new user for Prisma:
echo      CREATE USER 'prisma_app'@'localhost' IDENTIFIED WITH mysql_native_password BY 'YourPassword123!';
echo      GRANT ALL PRIVILEGES ON mydb.* TO 'prisma_app'@'localhost';
echo      FLUSH PRIVILEGES;
echo.
echo   5. Update your .env file with:
echo      DATABASE_URL="mysql://prisma_app:YourPassword123!@localhost:3306/mydb"
echo.
pause

