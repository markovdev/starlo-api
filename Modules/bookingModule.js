const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.ObjectId,
    required: [true, "Booking must belong to a room must "],
    ref: "Room",
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "Booking must belong to user"],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  paid: {
    type: Boolean,
    default: true,
  },
});
bookingSchema.index(
  { room: 1, user: 1 },
  {
    unique: true,
  }
);
bookingSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: ["_id", "name", "photo"],
  }).populate({
    path: "room",
    select: ["name", "price", "cover"],
  });
  next();
});
const Booking = mongoose.model("Booking", bookingSchema);
module.exports = Booking;
