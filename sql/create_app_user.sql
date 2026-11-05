-- Run as root in MySQL Workbench, after reset_demo.sql.
-- Replace YOUR_PASSWORD, then put the same value in DB_PASSWORD in .env.
-- The app connects with this user instead of root (least privilege).
CREATE USER IF NOT EXISTS 'meow_app'@'localhost' IDENTIFIED BY 'YOUR_PASSWORD';
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON meow_meow_tarot.* TO 'meow_app'@'localhost';