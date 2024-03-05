const mongoose = require("mongoose");

// Post Schema
const postSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    userId: String,
    title: String,
    author: String,
    content: String,
    dateTime: {
      type: Date,
      default: Date.now
    },
    likes: Array,
    comments: Array,
  });
  const post = mongoose.model("user_Post", postSchema);

  module.exports = { post };