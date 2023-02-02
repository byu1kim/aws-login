DROP DATABASE IF EXISTS auth;
CREATE DATABASE auth;
USE auth;

DROP USER IF EXISTS 'user'@'localhost';
CREATE USER 'user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'MyPassword1!';
GRANT ALL PRIVILEGES ON auth.* TO 'user'@'localhost';

DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  username VARCHAR(255) NOT NULL,
  profileImage VARCHAR(255)
);