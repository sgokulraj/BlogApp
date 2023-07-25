const mongoose = require("mongoose");

const { Schema, model } = mongoose;

const postSchema = new Schema(
  {
    title: {
      type: String,
    },
    summary: {
      type: String,
    },
    cover: {
      type: String,
    },
    description: {
      // becoz it containes path to file in string format
      type: String,
    },
    author: { type: Schema.Types.ObjectId, ref: "User" },
    // author: {
    //   type: Schema.Types.ObjectId,
    //   ref: "User",
    // },
  },
  {
    timestamps: true,
  }
);

const Post = model("Post", postSchema);

module.exports = Post;
