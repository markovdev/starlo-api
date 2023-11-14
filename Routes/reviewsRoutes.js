const express = require("express");
const reviewsController = require("../Controllers/reviewsController");
const authController = require("../Controllers/authController");
const router = express.Router({ mergeParams: true });
console.log("Hello from reviews");
router.use(authController.protect, authController.restrictTo("user"));
router
  .route("/")
  .get(reviewsController.getReviews)
  .post(reviewsController.createReview);

router
  .route("/:id")
  .get(reviewsController.getRoomReviews)
  .patch(reviewsController.updateReview)
  .delete(reviewsController.deleteOne);

// router.use(authController.restrictTo("admin"));
module.exports = router;
