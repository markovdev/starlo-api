const express = require("express");
const roomsController = require("../Controllers/roomsController");
const authController = require("../Controllers/authController");
const reviewRouter = require("./reviewsRoutes");
const router = express.Router();
router
  .route("/room-info")
  .get(
    authController.protect,
    authController.restrictTo("admin"),
    roomsController.roomStatistics
  );
router.use("/:roomID/reviews", authController.protect, reviewRouter);

router.route("/").get(roomsController.getAllRooms);
router.route("/:slug").get(roomsController.getRoom);

router.route("/").post(
  authController.protect,
  // authController.restrictTo("admin"),
  roomsController.uploadRoomPhotos,
  roomsController.resizeRoomPhotos,
  roomsController.createRoom
);
router
  .route("/:id")
  .delete(
    authController.protect,
    authController.restrictTo("admin"),
    roomsController.deleteRoom
  )
  .patch(
    authController.protect,
    authController.restrictTo("admin"),
    roomsController.updateRoom
  );
module.exports = router;
