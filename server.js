const express = require("express");
require("dotenv").config();
const mongoose = require("mongoose");
const cors = require("cors");
const { body } = require("express-validator");
const chalk = require("chalk");
const jwt = require("jsonwebtoken");
const { signupUser, signUpRequest, loginRequest } = require("./Schema/UserSchema");
const { post } = require("./Schema/PostSchema");
const app = express();

// Connection to MongoDb
const port = process.env.PORT;
const db = process.env.MONGO_DB_URI;
mongoose
  .connect(db)
  .then(() => {
    console.log(chalk.green(`Connected to ${db}`));
    app.listen(port, () => {
      if (mongoose.connection.readyState === 1) {
        console.log(chalk.green(`Server is running on port ${port}`));
      }
    });
  })
  .catch((error) => {
    console.log(chalk.red(`Server failed to run on port ${port}`));
    console.error(chalk.red(`MongoDB connection error: ${error}`));
  });

// Setting Cors
const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  Headers: ["Content-Type", "Authorization"],
};

// Verify Token
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) {
    return res.redirect("/login");
  }
  try {
    const decoded = jwt.verify(token, "afifurrahman");
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      res.setHeader("Clear-Site-Data", 'cache', 'cookies', 'storage');
      return res.redirect("/login");
    }
    console.error(error);
    return res.status(401).json({success: false, message: "Invalid Token"})
};
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sign Up Request
app.post(
  "/signup",
  [
    body("name").isString().isLength({ min: 3 }),
    body("email").isEmail(),
    body("password").isLength({ min: 8 }),
  ],
  signUpRequest
);

// Login Request
app.post(
  "/login",
  [body("email").isEmail(), body("password").isLength({ min: 8 })],
  loginRequest
);

// Create/Submit Request 
app.post("/submit", (req, res) => {
  const newPost = new post({
    _id: req.body._id,
    userId: req.body.id,
    author: req.body.author,
    content: req.body.content,
    likes: req.body.likes,
    comments: req.body.comments,
  });

  newPost
    .save()
    .then(() => {
      res.status(200).send(chalk.green("Data successfuly saved to Database"));
    })
    .catch((err) => {
      res
        .status(500)
        .send(chalk.red(`Error saving to database: ${err.message}`));
    });
});

// Get/Read Request
app.get("/userdata", verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const userId = req.user.userId;
    const postCount = parseInt(req.query.postCount) || 5;
    const skip = (page - 1) * postCount;
    const user = await signupUser.findOne({ _id: userId });
    const totalUsers = await post.countDocuments({ userId: userId });
    const data = await post
      .find({ userId: userId })
      .sort({ _id: -1 })
      .skip(skip)
      .limit(postCount)
      .exec();
    res.json({
      user: user,
      posts: data,
      totalPages: Math.ceil(totalUsers / postCount),
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(chalk.red("Internal Server Error", error));
  }
});

// Get/Read All posts Request
app.get("/newsfeed", verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page);
    const id = req.user.userId;
    const postCount = parseInt(req.query.postCount) || 5;
    const skip = (page - 1) * postCount;
    const user = await signupUser.findOne({ _id: id });
    const totalUsers = await post.countDocuments({});
    const data = await post
      .find({})
      .sort({ _id: -1 })
      .skip(skip)
      .limit(postCount)
      .exec();
    res.json({
      user: user,
      posts: data,
      totalPages: Math.ceil(totalUsers / postCount),
      currentPage: page,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send(chalk.red("Internal Server Error", error));
  }
});

// Delete All Request
app.delete("/deleteAll", async (req, res) => {
  try {
    const id = req.body.id;
    const data = await post.deleteMany({ id: id });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send(chalk.red("Internal Server Error", error));
  }
});

// Delete One Request
app.post("/deleteOne", async (req, res) => {
  try {
    const id = req.body.id;
    const data = await post.deleteOne({ _id: id });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send(chalk.red("Internal Server Error", error));
  }
});

// Edit/Update Request
app.all("/update", async (req, res) => {
  try {
    const id = req.body.id;
    const updatePost = {
      content: req.body.content,
    };
    const data = await post.updateOne({ _id: id }, updatePost);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send(chalk.red("Internal Server Errors", error));
  }
});

// Like/Dislike Request
app.post("/like/:postId", verifyToken, async(req, res) => {
  try {
    const postId = req.params.postId;
    const updateLikes = {
      likes: req.body,
    }
    const data = await post.updateOne({_id: postId}, updateLikes);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error", error);
  }
});

// Comment Request
app.post("/comment/:postId", verifyToken, async(req, res) => {
  try {
    const postId = req.params.postId;
    const comments = {
      comments: req.body,
    };

    const data = await post.updateOne({_id: postId}, comments);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error", error)
  }
});

// Comment Delete Request
app.post("/deletecomment/:postId", verifyToken, async(req, res) => {
  try {
    const postId = req.params.postId;
    const comments = {
      comments: req.body,
    };

    const data = await post.updateOne({_id: postId}, comments);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error", error)
  }
});