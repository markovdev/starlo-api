const express = require("express");
const authController = require("../Controllers/authController");
const userController = require("../Controllers/userController");
const bookingController = require("../Controllers/bookingController");

const router = express.Router({ mergeParams: true });
router.use(authController.protect, authController.restrictTo("user"));
router
  .route("/")
  .get(bookingController.getBooks)
  .post(bookingController.setRoomData, bookingController.createBook);
//   .delete(bookingController.deleteBook);

router.route("/:id").delete(bookingController.deleteBook);
module.exports = router;
