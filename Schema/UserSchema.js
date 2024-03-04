const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Sign Up Schema
const signupSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});
const signupUser = mongoose.model("registers", signupSchema);

// Sign Up Request
const signUpRequest = async(req, res) => {
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

    const token = jwt.sign({ userId: newSignupUser._id }, "afifurrahman", {
      expiresIn: "1h"
    });
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

// Login Request
const loginRequest = async(req, res) => {
  const { email, password } = req.body;

  try {
    const user = await signupUser.findOne({ email: email });
    if (user) {
      const token = jwt.sign({ userId: user._id }, "afifurrahman", {expiresIn: "1h"});
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
            userId: user._id,
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

module.exports = { signupUser, signUpRequest, loginRequest };
