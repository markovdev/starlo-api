const mongoose = require("mongoose");
const slugify = require("slugify");
const roomSchema = new mongoose.Schema({
  slug: String,
  name: {
    type: String,
    required: [true, "A room must have a name!"],
    // unique: true,
    trim: true,
  },
  time: {
    type: Number,
    default: 12,
  },
  price: {
    type: Number,
    required: [true, "A room must have a price!"],
  },
  cover: {
    type: String,
    required: [true, "A room must have a cover photo!"],
  },
  photos: {
    type: [String],
    required: [true, "A room must have photos!"],
  },

  bedsCount: {
    type: Number,
    required: [true, "A room must have a beds count"],
    trim: true,
  },
  extraBeds: {
    type: Number,
    default: 0,
    trim: true,
  },
  summary: {
    type: String,
    required: [true, "A room must have a summary!"],
  },
  meals: {
    type: Number,
    required: [true, "A room must have meals "],
    trim: true,
  },
  status: {
    type: String,
    default: "empty",
  },

  ratingsAverage: {
    type: Number,
    default: 2,
    min: [1, "Rating must be above 1.0"],
    max: [5, "Rating must be below 5.0"],
    set: (val) => Math.round(val * 10) / 10,
  },
  ratingsQuantity: {
    type: Number,
    default: 0,
  },

  createdAt: {
    type: Date,
    default: Date.now(),
  },
});
roomSchema.index({
  name: "text",
}); // for search engine

roomSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
const Room = mongoose.model("Room", roomSchema);
module.exports = Room;
