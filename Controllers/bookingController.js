const Book = require("../Modules/bookingModule");
const AppError = require("../utils/appError");
const Room = require("../Modules/roomModule");
const catchAsync = require("../utils/catchAsync");
const factory = require("./handlerFactory");
exports.setRoomData = catchAsync(async (req, res, next) => {
  if (!req.body.room) req.body.room = req.params.roomId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
});
exports.createBook = factory.createOne(Book);
exports.deleteBook = factory.deleteOne(Book);
exports.getBooks = catchAsync(async (req, res, next) => {
  console.log(req.user._id);
  const allBooks = await Book.find({ user: req.user.id });
  if (!allBooks)
    return next(new AppError("There is no bookings with this user!"));

  /**
   * Other way without populating
    const roomIDs = bookings.map((el) => el.room.id);
    const books = await Room.find({ _id: { $in: roomIDs } });
   */
  const roomIDs = allBooks.map((el) => el.room.id);
  const books = await Room.find({ _id: { $in: roomIDs } });
  res.status(200).json({
    status: "success",
    results: allBooks.length,
    data: {
      docs: allBooks,
    },
  });
});
