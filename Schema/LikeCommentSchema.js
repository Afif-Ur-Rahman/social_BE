const mongoose = require("mongoose");

// Like Comment Schema
const likeCommentSchema = new mongoose.Schema({
  _id: mongoose.Schema.Types.ObjectId,
  likes: Array,
  comments: Array,
//   date: {
//     type: String,
//     default: () => {
//       const currentDate = new Date();
//       const day = currentDate.getDate().toString().padStart(2, "0");
//       const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
//       const year = currentDate.getFullYear();
//       return `${day}-${month}-${year}`;
//     },
//   },
//   time: {
//     type: String,
//     default: () => {
//       const currentTime = new Date();
//       const hours = currentTime.getHours().toString().padStart(2, "0");
//       const minutes = currentTime.getMinutes().toString().padStart(2, "0");
//       return `${hours}:${minutes}`;
//     },
//   },
});
const likeComment = mongoose.model("likes_Comment", likeCommentSchema);

module.exports = { likeComment };
