// models/Interest.js
const mongoose = require("mongoose");

const InterestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  category: { 
    type: String, 
    enum: ["Sports", "Products", "Teams", "Athletes", "Cities"], 
    required: true 
  },
  image: { type: String }, // URL or filename
}, { timestamps: true });

module.exports = mongoose.model("Interest", InterestSchema);
