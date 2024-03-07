const mongoose = require("mongoose");

// Post Schema
const postSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  userId: String,
  author: String,
  content: String,
  date: {
    type: String,
    default: () => {
      const currentDate = new Date();
      const day = currentDate.getDate().toString().padStart(2, "0");
      const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
      const year = currentDate.getFullYear();
      return `${day}-${month}-${year}`;
    },
  },
  time: {
    type: String,
    default: () => {
      const currentTime = new Date();
      const hours = currentTime.getHours().toString().padStart(2, "0");
      const minutes = currentTime.getMinutes().toString().padStart(2, "0");
      return `${hours}:${minutes}`;
    },
  },
  likes: Array,
  comments: Array,
});
const post = mongoose.model("user_Post", postSchema);

module.exports = { post };
