// models/Pincode.js
const mongoose = require('mongoose');

const PincodeSchema = new mongoose.Schema({
  pincode: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        return /^[1-9][0-9]{5}$/.test(v); // 6-digit Indian pincode
      },
      message: props => `${props.value} is not a valid pincode!`
    }
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zone: {
    type: Number,
    enum: [1, 2, 3, 4, 5],
    required: true
  },
  serviceable: {
    type: Boolean,
    default: true
  },
  codAvailable: {
    type: Boolean,
    default: true
  },
  deliveryDays: {
    type: Number,
    min: 1,
    max: 10
  },
  nearbyPincodes: [String] // For suggesting alternatives
});

module.exports = mongoose.model('Pincode', PincodeSchema);