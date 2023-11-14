const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    let body = { ...req.body };
    if (req.user)
      body = {
        ...req.body,
        user: req.user,
      };
    const doc = await Model.create(body);

    res.status(201).json({
      status: "success",
      message: "Document created successfully!",
      data: {
        doc,
      },
    });
  });
exports.getOne = (Model, populateOpts, isSlug) =>
  catchAsync(async (req, res, next) => {
    let query = await Model.findById(req.params.id);
    if (isSlug) query = await Model.findOne({ slug: req.params.slug });
    if (populateOpts) query = query.populate(populateOpts);
    const doc = await query;
    if (!doc) {
      return next(new AppError("No doc found with that ID!", 404));
    }
    res.status(200).json({
      status: "success",
      data: {
        doc,
      },
    });
  });
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    console.log(req.params.id);
    const doc = await Model.findByIdAndDelete(req.params.id);
    console.log(req.params.id);

    console.log(doc);
    if (!doc) {
      return next(new AppError("No doc found with that ID!", 404));
    }
    res.status(204).json({
      status: "success",
      data: null,
    });
  });
exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError("No document found with that ID", 404));
    }
    res.status(200).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model, payload = null) =>
  catchAsync(async (req, res, next) => {
    console.log("Getting data...");
    let payload;
    if (payload) {
      payload = req.body.payload.trim();
    }
    let filter = {};
    if (req.params.roomId) filter = { room: req.params.roomId };
    // filter = { ...filter, name: { $regex: /Co/i } };
    console.log(filter);
    const features = new APIFeatures(
      // Model.find({ name: { $regex: /Co/, $options: "i" } }),
      // {$text: {$search: "Co"}}
      Model.find(filter),
      req.query
    )
      .search()
      .filter()
      .sort()
      .limitFields()
      .pagination();

    const docs = await features.query;
    res.status(200).json({
      status: "success",
      results: docs.length,
      data: {
        docs,
      },
    });
  });
