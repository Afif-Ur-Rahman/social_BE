const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { body, validationResult } = require("express-validator");
const chalk = require("chalk");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();

// Connection to MongoDb
const PORT = 5000;
const db =
  "mongodb+srv://AfifUrRahman:afif2017@cluster0.ydcgvn1.mongodb.net/Social_App?retryWrites=true&w=majority";
mongoose
  .connect(db)
  .then(() => {
    console.log(chalk.green(`Connected to ${db}`));
    app.listen(PORT, () => {
      if (mongoose.connection.readyState === 1) {
        console.log(chalk.green(`Server is running on port ${PORT}`));
      }
    });
  })
  .catch((error) => {
    console.log(chalk.red(`Server failed to run on port ${PORT}`));
    console.error(chalk.red(`MongoDB connection error: ${error}`));
  });

// Sign Up Schema
const signupSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});
const signupUser = mongoose.model("registers", signupSchema);

// Post Schema
const postSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  id: String,
  title: String,
  author: String,
  content: String,
});
const post = mongoose.model("user_Post", postSchema);

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
    res.redirect("/signup");
  }
  try {
    const decoded = jwt.verify(token, "afifurrahman");
    req.user = decoded;
    next();
  } catch (error) {
    console.error(error);
  }
};

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
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, email, password } = req.body;
      const existedUser = await signupUser.findOne({ email });
      if (existedUser) {
        return res
          .status(400)
          .json({ message: "Email Already Registered", success: false });
      }

      const hashedPass = await bcrypt.hash(password, 10);

      const newSignupUser = new signupUser({
        _id: req.body._id,
        name,
        email,
        password: hashedPass,
      });

      await newSignupUser.save();

      const token = jwt.sign({ userId: newSignupUser._id }, "afifurrahman");
      res.status(201).json({
        success: true,
        message: "Data Successfully Saved to Database",
        token,
        id: newSignupUser._id,
      });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({
        success: false,
        message: `Error saving data to database: ${error.message}`,
      });
    }
  }
);

// Login Request
app.post(
  "/login",
  [body("email").isEmail(), body("password").isLength({ min: 8 })],
  async (req, res) => {
    const { email, password } = req.body;

    try {
      const user = await signupUser.findOne({ email: email });
      if (user) {
        const token = jwt.sign({ userId: user._id }, "afifurrahman");
        bcrypt.compare(password, user.password, (err, response) => {
          if (err) {
            return res.status(500).json({
              success: false,
              message: err.message,
            });
          }

          if (response) {
            return res.json({
              success: true,
              message: "Logged In Successfully",
              name: user.name,
              id: user._id,
              token,
            });
          } else {
            return res.status(401).json({
              success: false,
              message: "Incorrect Email or Pasword",
            });
          }
        });
      } else {
        return res.status(401).json({
          success: false,
          message: "Incorrect Email or Password",
        });
      }
    } catch (error) {
      console.error(error);
      return res.json({
        success: false,
        message: "Incorrect Email or Password",
      });
    }
  }
);

// Create/Submit Request
app.post("/submit", (req, res) => {
  const newUser = new post({
    _id: req.body._id,
    id: req.body.id,
    title: req.body.title,
    author: req.body.author,
    content: req.body.content,
  });

  newUser
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
    const id = req.user.userId;
    const postCount = parseInt(req.query.postCount) || 5;
    const skip = (page - 1) * postCount;
    const user = await signupUser.findOne({_id: id});
    const totalUsers = await post.countDocuments({ id: id });
    const data = await post
      .find({ id: id })
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
    res.status(500).send(chalk.red("Internal Server Error"));
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
    res.status(500).send(chalk.red("Internal Server Error"));
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
    res.status(500).send(chalk.red("Internal Server Error"));
  }
});

// Edit/Update Request
app.all("/update", async (req, res) => {
  try {
    const id = req.body.id;
    const updatePost = {
      title: req.body.title,
      author: req.body.author,
      content: req.body.content,
    };
    const data = await post.updateOne({ _id: id }, updatePost);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send(chalk.red("Internal Server Errors"));
  }
});
