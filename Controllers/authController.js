const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const Email = require("../utils/email");
const AppError = require("../utils/appError");
const User = require("../Modules/userModule");
const sendNotifi = require("../utils/sendNotifi");
const speakeasy = require("speakeasy");
const qrCode = require("qrcode");
const { promisify } = require("util");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createSendToken = (user, statusCode, req, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expiresIn: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token, cookieOptions);
  // Remove password from output
  user.password = undefined;
  if (req && req.originalUrl.startsWith("/api")) {
    res.status(statusCode).json({
      status: "success",
      token,
      photo: user.photo,
      name: user.name,
      role: user.role,
      userId: user._id,
    });
  } else {
    res.redirect("/me");
  }
};
const credValidation = (message, next) => {
  return next(new AppError(message, 401));
};
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    // emailToken,
  });
  // const url = `${req.protocol}://${req.get("host")}/me`;

  // sendVerfiyEmail(newUser, req);
  createSendToken(newUser, 201, req, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email) return next(new AppError("Please provide an email!", 400));
  if (!password) return next(new AppError("Please provide an password!", 400));
  const curUser = await User.findOne({ email }).select("+password");

  if (!curUser || !(await curUser.correctPassword(password, curUser.password)))
    return next(new AppError(`Incorrect email or password!`, 401));
  // if (!curUser.isVerified)
  //   return next(
  //     new AppError(
  //       `Your account is not activated, Please activate it and try again!`,
  //       400
  //     )
  //   );

  if (curUser.isTwoFa) {
    const randomToken = crypto.randomBytes(32).toString("hex");

    const sendAuthToken = crypto
      .createHash("sha256")
      .update(randomToken)
      .digest("hex");
    console.log(sendAuthToken);
    curUser.sendTwoFactorRequestToken = sendAuthToken;
    await curUser.save({ validateBeforeSave: false });
    return res.status(200).json({
      status: "pending",
      message:
        "Logged in successfully, now you need to verify your two factor authntication!",
      sendTwoFactorRequestToken: sendAuthToken,
      isTwoFa: true,
    });
  }
  createSendToken(curUser, 200, req, res);
});
exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new AppError("You are not logged in! Please login to have access.", 401)
    );
  }
  const dec = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const curUser = await User.findById(dec.id);
  if (!curUser)
    return next(
      new AppError("The user belonging to this token does not exists!", 401)
    );

  if (curUser.changedPasswordAfter(dec.iat)) {
    return next(
      new AppError(
        "User recently changed his password! Please login again>",
        401
      )
    );
  }
  req.user = curUser;
  res.locals.user = curUser;
  next();
});
exports.isLoggedIn = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      token = req.cookies.jwt;
      const dec = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      const curUser = await User.findById(dec.id);
      if (!curUser) return next();
      if (curUser.changedPasswordAfter(dec.iat)) {
        return next();
      }
      res.locals.user = curUser;
      return next();
    } catch (err) {
      return next();
    }
  }

  next();
});
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const email = req.body.email;
  if (!email) return next(new AppError("Please provide email!", 401));
  const user = await User.findOne({ email });
  if (!user)
    return next(new AppError("No user found with this email address!", 404));
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetPassword/${resetToken}`;
  const message = `If you forgot your password submit a PATCH request with your new password to this link ${resetURL},\nIf you don't, Please ignore this message`;
  res.status(200).json({
    status: "success",
    message: "Token sent to your email",
  });
  next();
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  if (!user) return next(new AppError("Token is invalid or has expired", 400));
  const { password, confirmPassword } = req.body;
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");
  const { currentPassword, newPassword, newConfirmPassword } = req.body;
  if (!currentPassword)
    credValidation("Please provide your current password", next);

  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError("Incorrect password. Please try again!", 401));
  }
  user.password = newPassword;
  user.confirmPassword = newConfirmPassword;
  await user.save();
  createSendToken(user, 200, req, res);
});
exports.logout = (req, res) => {
  res.cookie("jwt", "loggedout", {
    expires: new Date(Date.now() + 1000),
    httpOnly: true,
  });
  res.redirect("/");
};
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You don not have permission to perform this action", 403)
      );
    }
    next();
  };
};
exports.protectedGet = catchAsync(async (req, res, next) => {
  if (!req.user) {
    res.status(401).render("home/error", {
      errType: "Unauthorized Access",
      errMsg: "You do not have access to this route! Please login.",
      errBtn: true,
    });
  }
  next();
});
exports.verfyEmail = catchAsync(async (req, res, next) => {
  const curUser = await User.findOne({ emailToken: req.params.token });
  if (!curUser) {
    return next(
      new AppError("No user found with this token. Please try again!", 404)
    );
  }
  curUser.emailToken = undefined;
  curUser.isVefied = true;
  await curUser.save({ validateBeforeSave: false });
  if (req.originalUrl.startsWith("/api")) {
    res.status(200).json({
      status: "success",
      message: "Account Verfied successfully",
      data: {
        newUser,
      },
    });
  }
  res.status(200).render("home/welcome");
});
exports.registerTwoFactorAuth = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const secret = speakeasy.generateSecret();
  // const curUser = await User.findByIdAndUpdate(userId, {
  //   twoFactorAuthSecret: secret.base32,
  // });
  const curUser = await User.findById(req.user.id);
  if (curUser.isTwoFa)
    return next(new AppError("This user has activated 2fa prev!", 400));
  curUser.twoFactorAuthSecret = secret.base32;
  // curUser.isTwoFa = true;
  await curUser.save({ validateBeforeSave: false });
  const url = speakeasy.otpauthURL({
    secret: secret.base32,
    label: req.user.name,
  });
  qrCode.toDataURL(url, function (err, url) {
    if (err) return next(new AppError(err, 400));
    res.status(200).json({
      status: "success",
      qrCodeUrl: url,
      hash: secret.base32,
    });
    // .json("activeTwoFa", { qrCodeURL: url, hashCode: secret.base32 });
  });
});
exports.verifyTwoFactorAuth = catchAsync(async (req, res, next) => {
  console.log(req.body);
  const curUser = await User.findOne({
    sendTwoFactorRequestToken: req.body.accessToken,
  }).select("+twoFactorAuthSecret");
  console.log(curUser);
  const otpToken = curUser.twoFactorAuthSecret;
  const { otp } = req.body;

  const token =
    speakeasy.totp({
      secret: otpToken,
    }) * 1;
  console.log(otp, token);
  if (token !== otp * 1)
    return res.status(400).json({
      status: "fail",
      message: "Verification faild. Please try again!",
    });
  curUser.sendTwoFactorRequestToken = undefined;
  await curUser.save({
    validateBeforeSave: false,
  });
  createSendToken(curUser, 200, req, res);
});
exports.verfiyTwoFactorStatus = catchAsync(async (req, res, next) => {
  console.log(req.user);
  const userToken = req.headers.authorization.split(" ")[1];
  const curUser = await User.findById(req.user.id).select(
    "+twoFactorAuthSecret"
  );
  const otpToken = curUser.twoFactorAuthSecret;
  const { otp } = req.body;

  const token =
    speakeasy.totp({
      secret: otpToken,
    }) * 1;
  console.log(otp, token);
  if (token !== otp * 1)
    return res.status(400).json({
      status: "fail",
      message: "Verification faild. Please try again!",
    });
  curUser.sendTwoFactorRequestToken = undefined;
  curUser.isTwoFa = true;
  await curUser.save({
    validateBeforeSave: false,
  });
  createSendToken(curUser, 200, req, res);
});
