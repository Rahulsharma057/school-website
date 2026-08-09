const HomeSlider = require("../models/HomeSlider");

const uploadToCloudinary = require("../utils/uploadToCloudinary");

const deleteFromCloudinary = require("../utils/deleteFromCloudinary");

const asyncHandler = require("../helpers/asyncHandler");

// ================= CREATE SLIDER =================

exports.createSlider = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,

      message: "Image is required",
    });
  }

  const result = await uploadToCloudinary(req.file);

  const slider = await HomeSlider.create({
    ...req.body,

    image: {
      url: result.secure_url,

      public_id: result.public_id,
    },
  });

  res.status(201).json({
    success: true,

    data: slider,

    message: "Slider created successfully",
  });
});

// ================= GET ALL SLIDER =================

exports.getSliders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;

  const limit = Number(req.query.limit) || 10;

  const search = req.query.search || "";

  const query = {};

  if (search) {
    query.title = {
      $regex: search,

      $options: "i",
    };
  }

  const total = await HomeSlider.countDocuments(query);

  const sliders = await HomeSlider.find(query)

    .sort({
      order: 1,
    })

    .skip((page - 1) * limit)

    .limit(limit);

  res.json({
    success: true,

    data: sliders,

    total,

    page,

    limit,

    totalPages: Math.ceil(total / limit),
  });
});

// ================= GET SINGLE =================

exports.getSlider = asyncHandler(async (req, res) => {
  const slider = await HomeSlider.findById(req.params.id);

  if (!slider) {
    return res.status(404).json({
      success: false,

      message: "Slider not found",
    });
  }

  res.json({
    success: true,

    data: slider,
  });
});

// ================= PUBLIC SLIDER =================

exports.getPublicSliders = asyncHandler(async (req, res) => {
  const sliders = await HomeSlider.find({
    status: true,
  })

    .sort({
      order: 1,
    })

    .select("title description buttonText buttonLink image order status");

  res.json({
    success: true,

    count: sliders.length,

    data: sliders,
  });
});

// ================= UPDATE SLIDER =================

exports.updateSlider = asyncHandler(async (req, res) => {
  const slider = await HomeSlider.findById(req.params.id);

  if (!slider) {
    return res.status(404).json({
      success: false,

      message: "Slider not found",
    });
  }

  if (req.file) {
    if (slider.image?.public_id) {
      await deleteFromCloudinary(slider.image.public_id);
    }

    const result = await uploadToCloudinary(req.file);

    slider.image = {
      url: result.secure_url,

      public_id: result.public_id,
    };
  }

  slider.title = req.body.title;

  slider.description = req.body.description;

  slider.buttonText = req.body.buttonText;

  slider.buttonLink = req.body.buttonLink;

  slider.order = req.body.order;

  await slider.save();

  res.json({
    success: true,

    data: slider,

    message: "Slider updated successfully",
  });
});

// ================= UPDATE STATUS =================

exports.updateSliderStatus = asyncHandler(async (req, res) => {
  const slider = await HomeSlider.findById(req.params.id);

  if (!slider) {
    return res.status(404).json({
      success: false,

      message: "Slider not found",
    });
  }

  slider.status = req.body.status;

  await slider.save();

  res.json({
    success: true,

    data: slider,

    message: "Status updated",
  });
});

// ================= DELETE =================

exports.deleteSlider = asyncHandler(async (req, res) => {
  const slider = await HomeSlider.findById(req.params.id);

  if (!slider) {
    return res.status(404).json({
      success: false,

      message: "Slider not found",
    });
  }

  if (slider.image?.public_id) {
    await deleteFromCloudinary(slider.image.public_id);
  }

  await slider.deleteOne();

  res.json({
    success: true,

    message: "Slider deleted successfully",
  });
});
