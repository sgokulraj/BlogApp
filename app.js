const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/userModel");
const Post = require("./models/postModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const multer = require("multer");
const fs = require("fs");

const app = express();
dotenv.config();
const PORT = process.env.PORT;
const CONNECTION_URL = process.env.CONNECTION_URL;
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const salt = bcrypt.genSaltSync(10);
const uploadMiddleware = multer({ dest: "uploads/" });

app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use("/uploads/", express.static(__dirname + "/uploads/"));

app.post("/register", async (req, res) => {
  const { username, password, email } = req.body;
  //to check user already exists in DB
  // const userFind = await User.findOne({ email });
  // if (userFind) {
  //   res.status(400).json({msg: "User already exists"});
  // }
  // if not exists, create new user
  try {
    const userDetails = await User.create({
      username,
      password: bcrypt.hashSync(password, salt),
      email: email.toLowerCase(),
    });
    res.status(201).json(userDetails);
  } catch (err) {
    res.status(400).json(err);
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const userAuth = await User.findOne({ email });
  if (userAuth) {
    const crctPass = bcrypt.compareSync(password, userAuth.password);
    if (crctPass) {
      const token = jwt.sign(
        { email, username: userAuth.username, id: userAuth._id },
        JWT_SECRET_KEY,
        {},
        (err, token) => {
          if (err) throw err;
          res
            .cookie("token", token)
            .json({ id: userAuth._id, username: userAuth.username });
        }
      );
    } else {
      res.status(404).json("Invalid Credentials");
    }
  } else {
    res.status(404).json("User not Found");
  }
});

app.get("/profile", (req, res) => {
  let { token } = req.cookies;
  jwt.verify(token, JWT_SECRET_KEY, {}, (err, msg) => {
    if (err) {
      res.json(err);
    } else {
      res.json(msg);
    }
  });
});

app.post("/logout", async (req, res) => {
   res.cookie("token", "").json("ok");
});

//to create post
app.post("/posts/create", uploadMiddleware.single("file"), async (req, res) => {
  //adding extension to the file uploaded so that we can view it
  let newPath = null;
  if (req.file) {
    const { originalname, path } = req.file;
    const orgNameArr = originalname.split(".");
    const extension = orgNameArr[orgNameArr.length - 1];
    newPath = path + "." + extension;
    fs.renameSync(path, newPath);
  }
  //adding up the id of the user who creates the post
  const { token } = req.cookies;
  jwt.verify(token, JWT_SECRET_KEY, {}, async (err, info) => {
    if (err) throw err;
    //uploading to DB
    const { title, summary, description } = req.body;
    const createpost = await Post.create({
      title,
      summary,
      description,
      cover: newPath ? newPath : null,
      author: info.id,
    });
    res.status(201).json(createpost);
  });
});

//to get all Posts
app.get("/posts", async (req, res) => {
  const posts = await Post.find()
    .populate("author", ["username"])
    .sort({ createdAt: -1 });
  res.status(200).json(posts);
});

//to get single Post
app.get("/posts/:id", async (req, res) => {
  const { id } = req.params;
  const post = await Post.findById(id).populate("author", ["username"]);
  res.status(200).json(post);
});

//to edit the post
app.put("/posts/:id", uploadMiddleware.single("file"), async (req, res) => {
  let newPath = null;
  if (req.file) {
    //adding extension to the file uploaded so that we can view it
    const { originalname, path } = req.file;
    const orgNameArr = originalname.split(".");
    const extension = orgNameArr[orgNameArr.length - 1];
    newPath = path + "." + extension;
    fs.renameSync(path, newPath);
  }
  //adding up the id of the user who creates the post
  const { token } = req.cookies;
  jwt.verify(token, JWT_SECRET_KEY, {}, async (err, info) => {
    if (err) throw err;
    //Before uploading to DB, recheck on server side that author of the post is same as loggedin user

    const { id, title, summary, description } = req.body;
    const postDetails = await Post.findById(id);
    const isAuthor =
      JSON.stringify(postDetails.author) === JSON.stringify(info.id);
    if (!isAuthor) {
      return res.status(400).json("You are not allowed to edit this post");
    }
    await Post.findByIdAndUpdate(id, {
      title,
      summary,
      description,
      cover: newPath ? newPath : postDetails.cover,
      author: info.id,
    });
    res
      .status(200)
      .json({ success: true, message: "Post updated successfully" });
  });
});

//deleting the post
app.delete("/posts/:id", async (req, res) => {
  const {id} = req.params;
 await Post.findByIdAndRemove(id)
 res.status(200).json("ok")
});

mongoose
  .connect(CONNECTION_URL)
  .then(() =>
    app.listen(PORT, () => {
      console.log(`Server is running in 5000  `);
    })
  )
  .catch((err) => console.log(err));
