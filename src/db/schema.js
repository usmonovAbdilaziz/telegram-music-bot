// db/schema.js
const { Schema, model } = require("mongoose");

const userSchema = new Schema({
  userId: { type: Number, required: true, unique: true }, // Telegram foydalanuvchi ID
  username: { type: String, required: false }, // Ba’zi userlarda bo‘lmasligi mumkin
  phone_number: { type: String, required: false }, // Telefon ixtiyoriy
  first_name: { type: String },
  last_name: { type: String },
  createdAt: { type: Date, default: Date.now }, // Foydalanuvchi qachon qo‘shilgan
});

const User = model("User", userSchema);

module.exports = User;
