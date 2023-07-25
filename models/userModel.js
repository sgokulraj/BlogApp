const mongoose = require("mongoose")

const { Schema, model } = mongoose;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    trim: true,
    unique: true,
    minLength: [5, "Enter atleast 5 characters"],
  },
  password: {
    type: String,
    required: true,
    minLength: [6, "Enter atleast 6 characters"],
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
});
const User = model("User", userSchema);

// export default User
module.exports = User