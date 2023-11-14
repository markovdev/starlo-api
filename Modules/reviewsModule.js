const mongoose = require("mongoose");
const Room = require("./roomModule");
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, "A review can not be empty"],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    room: {
      type: mongoose.Schema.ObjectId,
      ref: "Room",
      required: [true, "Review must belong to a room!"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user!"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
reviewSchema.index(
  { room: 1, user: 1, review: 1 },
  {
    unique: true,
  }
);
reviewSchema.pre(/^find/, function (next) {
  this.populate({
    path: "user",
    select: "name photo",
  });
  next();
});
// This function will be on current document (EX: Review.calcAvgRatings)
reviewSchema.statics.calcAvgRatings = async function (room) {
  const stats = await this.aggregate([
    {
      $match: { room },
    },
    {
      $group: {
        _id: `$room`,
        ratingsNumbers: { $sum: 1 },
        ratingsAvg: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Room.findByIdAndUpdate(room, {
      ratingsQuantity: stats[0].ratingsNumbers,
      ratingsAverage: stats[0].ratingsAvg,
    });
  } else {
    await Room.findByIdAndUpdate(room, {
      ratingsQuantity: 0,
      ratingsAverage: 2, // 2 Is default value for ratingsAverage
    });
  }
};
reviewSchema.post("save", function () {
  this.constructor.calcAvgRatings(this.room);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.newReview = await this.findOne();
  next();
});
reviewSchema.post(/^findOneAnd/, async function () {
  await this.newReview.constructor.calcAvgRatings(this.newReview.room);
});
const Review = mongoose.model("Review", reviewSchema);
module.exports = Review;
