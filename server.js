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
    res.status(400).send({ status: "error", message: "missing fields" });
    return;
  }

  // validate email
  const user = await db.getUserWithEmail(email);
  if (!user) {
    res.status(400).send({ status: "error", message: "invalid email" });
    return;
  }

  // validate password
  const hasedPassword = user.password;
  const matchPassword = await bcrypt.compare(password, hasedPassword); // true or false
  if (!matchPassword) {
    res.status(400).send({ status: "error", message: "invalid password" });
    return;
  }

  // generate token without password
  const token = jwt.generateToken({
    sub: user.id,
    email: user.email,
    username: user.username,
    profileImg: user.profileImg,
  });
  res.send(token);
});

// SINGUP
app.post("/api/signup", upload.single("profileImg"), async (req, res) => {
  // validate email, password
  const { email, password, username } = req.body;
  let profileImg = "no image";

  if (!email || !password || !username) {
    res.status(400).send({ status: "error", message: "missing fields" });
  }

  // hasing password
  const salt = await bcrypt.genSalt(13);
  const hashedPassword = await bcrypt.hash(password, salt);

  // validate profile Img
  if (req.file) {
    const { imageBuffer, fileName, mimeType } = req.file;
    profileImg = req.file.fileName;
    await s3.uploadImg(fileName, imageBuffer, mimeType);
  }

  // create db
  const result = await db.createUser(
    email,
    hashedPassword,
    username,
    profileImg
  );

  res.status(200).send(result);
});

// GET USER

app.get("/api/user", jwt.authorize, async (req, res) => {
  const userId = req.user.sub;
  const user = await db.getUserById(userId);
  res.send(user);
});

// UPDATE : Display Name
app.put("/api/username", jwt.authorize, async (req, res) => {
  console.log("🔅This is Update!");
  const userId = req.user.sub;

  const { username } = req.body;
  const updatedName = await db.updateUserName(userId, username);
  res.redirect("/profile");
});

// UPDATE : Profile Image
app.put(
  "/api/profileimg",
  jwt.authorize,
  upload.single("profileImg"),
  async (req, res) => {
    if (!req.file) {
      res.send({ status: "image not available" });
      return;
    }
    const userId = req.user.sub;
    const profileImg = req.user.profileImg;

    // s3 add
    const { imageBuffer, fileName, mimeType } = req.file;
    await s3.uploadImg(fileName, imageBuffer, mimeType);

    // s3 delete
    if (user.profileImg != "no image") {
      await s3.deleteImg(profileImg);
    }

    const updatedImg = await db.updateUserProfileImage(userId, fileName);
    res.send(updatedImg);
  }
);

// Logout
// Authenticated page : profile is only accessible to the login user

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`✅ Listening server port ${PORT}`);
});

// PUT : replace data
// POST : create data, absolutely anything
// GET : get data
// DELETE : delete data
