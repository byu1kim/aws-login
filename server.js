import express from "express";
import multer from "multer";
import bcrypt from "bcrypt";
import * as db from "./database.js";
import * as jwt from "./jwt.js";
import * as s3 from "./s3.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage });

// LOGIN
app.post("/api/login", async (req, res) => {
  // validate login information from frontend
  const { email, password } = req.body;

  if (!email || !password) {
    res.send({ status: "error", message: "missing fields" });
    return;
  }

  // validate email
  const user = await db.getUserWithEmail(email);
  if (!user) {
    res.send({ status: "error", message: "invalid email" });
    return;
  }

  // validate password
  const hasedPassword = user.password;
  const matchPassword = await bcrypt.compare(password, hasedPassword); // true or false
  if (!matchPassword) {
    res.send({ status: "error", message: "invalid password" });
    return;
  }

  const signedImgUrl = await s3.getImgUrl(user.profileImage);
  // generate token without password
  const token = jwt.generateToken({
    sub: user.id,
    email: user.email,
    username: user.username,
    profileImg: signedImgUrl,
  });
  res.send(token);
});

// SINGUP
app.post("/api/signup", upload.single("profileImg"), async (req, res) => {
  // validate email, password
  const { email, password, username } = req.body;
  let profileImg = "no image";
  let signedImgUrl = profileImg;
  if (!email || !password || !username) {
    res.status(400).send({ status: "error", message: "missing fields" });
  }

  // hasing password
  const salt = await bcrypt.genSalt(13);
  const hashedPassword = await bcrypt.hash(password, salt);

  // validate profile Img
  if (req.file) {
    const { buffer, originalname, mimetype } = req.file;
    profileImg = req.file.originalname;
    await s3.uploadImg(originalname, buffer, mimetype);
    signedImgUrl = await s3.getImgUrl(updatedProfile.profileImage);
  }

  // create db
  const result = await db.createUser(email, hashedPassword, username, profileImg);

  const token = jwt.generateToken({
    sub: result.id,
    email: result.email,
    username: result.username,
    profileImg: signedImgUrl,
  });

  res.status(200).send(token);
});

// GET USER

app.get("/api/user", jwt.authorize, async (req, res) => {
  const userId = req.user.sub;
  const user = await db.getUserById(userId);
  res.send(user);
});

// UPDATE
app.put("/api/updateProfile", jwt.authorize, upload.single("profileImg"), async (req, res) => {
  let profileImg;

  const userId = req.user.sub;
  const { username } = req.body;
  const oldProfile = await db.getUserById(userId);
  profileImg = oldProfile.profileImage;

  if (req.file) {
    profileImg = req.file.originalname;
    // s3 add
    const { buffer, originalname, mimetype } = req.file;
    await s3.uploadImg(originalname, buffer, mimetype);
  }

  // // s3 delete
  // if (user.profileImg != "no image") {
  //   await s3.deleteImg(profileImg);
  // }

  const updatedProfile = await db.updateProfile(userId, username, profileImg);
  let signedImgUrl = "no image";
  if (profileImg != "no image") {
    signedImgUrl = await s3.getImgUrl(updatedProfile.profileImage);
  }

  const token = jwt.generateToken({
    sub: updatedProfile.id,
    email: updatedProfile.email,
    username: updatedProfile.username,
    profileImg: signedImgUrl,
  });

  res.send(token);
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Listening server port ${PORT}`);
});

// PUT : replace data
// POST : create data, absolutely anything
// GET : get data
// DELETE : delete data
