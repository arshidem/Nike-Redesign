const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: (props) => `${props.value} is not a valid email address!`,
      },
    },

    name: {
      type: String,
      required: false,
      trim: true,
      minlength: [2, "Name must be at least 2 characters long"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    gender: {
      type: String,
      required: false,
      enum: {
        values: ["male", "female", "other", "prefer-not-to-say"],
        message: "{VALUE} is not a valid gender",
      },
    },

    // ✅ NEW fields
    dob: {
      type: String, // use Date if preferred: type: Date
      default: null,
    },

    phone: {
      type: String,
      validate: {
        validator: function (v) {
          return /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{3,15}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
      trim: true,
    },

    country: {
      type: String,
      default: "",
      trim: true,
    },

    state: {
      type: String,
      default: "",
      trim: true,
    },

    city: {
      type: String,
      default: "",
      trim: true,
    },

    postalCode: {
      type: String,
      default: "",
      trim: true,
    },

    otp: {
      type: String,
      select: false,
      default: null,
    },

    otpExpires: {
      type: Date,
      select: false,
      default: null,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },

    lastLogout: {
      type: Date,
      default: null,
    },

    profilePicture: {
      type: String,
      default: null,
    },

    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
      },
      theme: { type: String, default: "light" },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        delete ret.otp;
        delete ret.otpExpires;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Indexes
UserSchema.index({ isActive: 1, role: 1 });

// Virtual for full user status
UserSchema.virtual("status").get(function () {
  if (!this.isActive) return "inactive";
  if (!this.name || !this.gender) return "pending";
  return "active";
});

// Pre-save hook for email normalization
UserSchema.pre("save", function (next) {
  if (this.isModified("email")) {
    this.email = this.email.toLowerCase().trim();
  }
  next();
});

// Static method to handle login (update isActive and lastLogin)
UserSchema.statics.handleLogin = async function (userId) {
  return this.findByIdAndUpdate(
    userId,
    {
      $set: { isActive: true },
      $currentDate: { lastLogin: true },
    },
    { new: true }
  );
};

// Static method to handle logout (update isActive and lastLogout)
UserSchema.statics.handleLogout = async function (userId) {
  return this.findByIdAndUpdate(
    userId,
    {
      $set: { isActive: false },
      $currentDate: { lastLogout: true },
    },
    { new: true }
  );
};

module.exports = mongoose.model("User", UserSchema);
