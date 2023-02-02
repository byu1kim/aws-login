import mysql from "mysql2";
import dotenv from "dotenv";
dotenv.config();

const pool = mysql
  .createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT || 3306,
  })
  .promise();

export async function getUserById(id) {
  const [result] = await pool.query(`SELECT * FROM users WHERE id = ?`, [id]);
  return result[0];
}

export async function createUser(email, password, username, profileImg) {
  const [result] = await pool.query(
    `INSERT INTO users (email, password, username, profileImage) VALUES (?, ?, ?, ?)`,
    [email, password, username, profileImg]
  );
  const user = await getUserById(result.insertId);
  return user;
}

export async function getUserWithEmail(email) {
  const [result] = await pool.query(`SELECT * FROM users WHERE email = ?`, [
    email,
  ]);
  return result[0]; // to return only obejct not array
}

export async function updateUserName(id, username) {
  const [results] = await pool.query(
    `UPDATE users SET username = ? WHERE id = ?`,
    [username, id]
  );
  return results;
}

export async function updateUserProfileImage(id, profileImg) {
  const [results] = await pool.query(
    `UPDATE users SET profileImage = ? WHERE id = ?`,
    [profileImg, id]
  );
  return results;
}
