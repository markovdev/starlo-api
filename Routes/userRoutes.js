const express = require("express");
const authController = require("../Controllers/authController");
const userController = require("../Controllers/userController");
const bookingRouter = require("./bookingRoutes");

const router = express.Router();
router.use("/:roomId/booking", bookingRouter);
router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);
router.post("/verifyTwoFactorAuth", authController.verifyTwoFactorAuth);

router.use(authController.protect);
router.get("/registerTwoFactorAuth", authController.registerTwoFactorAuth);
router.post("/verifyTwoFactorAuthStatus", authController.verfiyTwoFactorStatus);

router.patch("/updateMyPassword", authController.updatePassword);
router.get("/me", userController.getMe, userController.getUser);
router.patch(
  "/updateMe",
  userController.uploadUserphoto,
  userController.resizeUserPhoto,
  userController.updateMe
);
router.delete("/deleteMe", userController.setUserId, userController.deleteMe);
router.use(authController.protect, authController.restrictTo("user"));
// router
//   .route("/:roomId/bookings")
//   .post(bookingController.setRoomData, bookingController.createBook);
module.exports = router;
