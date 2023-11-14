module.exports = (req, res, msg, statusCode, status) => {
  if (req.originalUrl.startsWith("/api")) {
    res.status(statusCode).json({
      status,
      message: msg,
    });
  } else {
    res.status(statusCode).render("home/message", {
      msg,
    });
  }
};
