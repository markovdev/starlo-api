const factory = require("./handlerFactory");
const Room = require("../Modules/roomModule");
const mongoose = require("mongoose");
const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError("Not an image. Please upload only images!", 400), false);
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});
exports.uploadRoomPhotos = upload.fields([
  {
    name: "cover",
    maxCount: 1,
  },
  {
    name: "photos[]",
    maxCount: 3,
  },
]);

exports.resizeRoomPhotos = catchAsync(async (req, res, next) => {
  // Handle cover and photos name to DB
  console.log(req.files);
  if (!req.files) return next(new AppError("You must upload room photos!"));
  req.body.cover = `room-${Math.ceil(Math.random())}-${Date.now()}-cover.jpeg`;
  await sharp(req.files.cover[0].buffer)
    .resize(2000, 1333)
    .toFormat("jpeg")
    .jpeg({ quality: 90 })
    .toFile(`public/img/rooms/${req.body.cover}`);

  // Proccess multiple photos
  req.body.photos = [];
  // Move to the next middleware when all photos are done
  await Promise.all(
    req.files["photos[]"].map(async (photo, i) => {
      const photoName = `room-${Date.now()}-${i + 1}.jpeg`;
      await sharp(photo.buffer)
        .resize(2000, 1333)
        .toFormat("jpeg")
        .jpeg({ quality: 90 })
        .toFile(`public/img/rooms/${photoName}`);
      req.body.photos.push(photoName);
    })
  );

  // req.body.photos = photosFilesNames;
  next();
});
// exports.resizeRoomPhoto = async (req, res, next) => {
//   console.log(req.file);
//   if (!req.file) return next();
//   req.file.filename = `room-${Math.random()}-${Date.now()}.jpeg`;
//   const curImage = fs.writeFileSync(
//     "../frontend/" + req.file.filename,
//     req.file.buffer
//   );

//   req.body.photo = req.file.filename;
//   next();
// };
exports.getAllRooms = factory.getAll(Room, { payload: true });

exports.createRoom = factory.createOne(Room);
exports.getRoom = factory.getOne(Room, null, true);
exports.updateRoom = factory.updateOne(Room);
exports.deleteRoom = factory.deleteOne(Room);
exports.roomStatistics = async (req, res, next) => {
  try {
    const stats = await Room.aggregate([
      {
        $match: { ratingsAverage: { $gte: 4.5 } },
      },
      {
        $group: {
          _id: "$bedsCount",
          roomsNumber: { $sum: 1 },
          roomsRatingsQuantity: { $avg: "$ratingsQuantity" },
          roomRatingsAverage: { $avg: "$ratingsAverage" },
        },
      },
      {
        // Sort by quantity
        $sort: { roomsRatingsQuantity: 1 },
      },
    ]);
    res.status(200).json({
      status: "success",
      length: stats.length,
      data: {
        stats,
      },
    });
  } catch (err) {
    console.log(`Error 💥: ${err}`);
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};
