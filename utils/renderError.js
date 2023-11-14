class RenderError extends Error {
  constructor(message, page) {
    super(message);
    this.statusCode = 404;
    this.page = page;
    Error.captureStackTrace(this, this.constructor);
  }
  // authError() {
  //   this.res.status(401).render(this.page, {
  //     title: "unauthorized access",
  //     errorType: "unauthorized access",
  //     errorMsg:
  //       "You don't have access to this page. Please go to the main page!",
  //   });
  // }
  // invalidToken() {
  //   this.res.status(401).render(this.page, {
  //     title: "Token Error",
  //     errorType: "unauthorized access",
  //     errorMsg: "No token found with this user!",
  //   });
  // }
  // error(message) {
  //   this.res.status(400).render(this.page, {
  //     title: "An Error Accourd",
  //     errorMsg: this.message,
  //   });
  // }
}
module.exports = RenderError;
