const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require("validator");
const crypto = require("crypto");
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    required: [true, "A user must have a name!"],
  },
  email: {
    type: String,
    trim: true,
    unique: true,
    required: [true, "A user must have a email!"],
  },
  photo: {
    type: String,
    trim: true,
    default: "user.png",
  },
  role: {
    type: String,
    default: "user",
  },
  password: {
    type: String,
    required: [true, "A user must have a password!"],
    minLength: 8,
    select: false,
  },
  confirmPassword: {
    type: String,

    required: [true, "Please Confirm your password!"],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
  hasBookings: {
    type: Boolean,
    default: false,
  },
  bookingsCount: Number,
  secretToken: String,
  joined: {
    type: Date,
    default: Date.now(),
  },
  passwordChangedAt: {
    type: Date,
  },
  emailToken: String,

  isVerified: {
    type: Boolean,
    default: false,
  },
  isTwoFa: {
    type: Boolean,
    default: false,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  sendTwoFactorRequestToken: String,
  twoFactorAuthSecret: String,
});
userSchema.pre("save", async function (next) {
  // To run this function if password was modified
  if (!this.isModified("password")) return next();
  // Hash the password
  this.password = await bcrypt.hash(this.password, 12);
  // Delete confirmPassword before saving it to DB
  this.confirmPassword = undefined;
  next();
});
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false; // This means password is not changed
};
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};
const User = mongoose.model("User", userSchema);
module.exports = User;
