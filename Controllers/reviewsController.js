const Review = require("../Modules/reviewsModule");
const factory = require("./handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
exports.getReviews = factory.getAll(Review);
exports.createReview = catchAsync(async (req, res, next) => {
  const body = {
    ...req.body,
    user: req.user,
    room: req.params.roomID,
  };
  const review = await Review.create(body);
  res.status(201).json({
    status: "success",
    message: "Review Created Successfully",
    data: {
      review,
    },
  });
});
exports.getRoomReviews = catchAsync(async (req, res, next) => {
  console.log(req.params);
  if (!req.params.id) return next(new AppError("Please specify room ID!", 400));
  const reviews = await Review.find({ room: req.params.id });
  if (!reviews)
    return next(new AppError("There is no reviews with this room ID!", 400));
  console.log(reviews);
  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: reviews,
  });
});

exports.getReview = factory.getOne(Review);
exports.deleteOne = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
