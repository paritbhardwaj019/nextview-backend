const httpStatus = require("http-status");
const Support = require("../models/Support");

const createSupportRequest = async (req, res) => {
  try {
    const createdSupport = await Support.create({
      ...req.body,
      dealer: req.authUser?._id,
    });
    res.status(httpStatus.CREATED).send(createdSupport);
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: "fail",
      msg: error.message || "Something went wrong",
      stack: process.env.NODE_ENV === "development" ? error.stack : {},
    });
  }
};

const getAllSupportRequests = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  let query = {};

  try {
    if (status) {
      query.status = status;
    }

    const allSupportRequests = await Support.find(query)
      .populate("dealer")
      .sort({
        category: 1,
        createdAt: -1,
      })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .exec();

    const totalSupportRequestsCount = await Support.countDocuments(query);
    const totalPages = Math.ceil(totalSupportRequestsCount / limit);

    res.status(httpStatus.OK).json({
      status: "success",
      msg: "Fetched All Support Requests",
      data: {
        totalResults: totalSupportRequestsCount,
        totalPages: totalPages,
        currentPage: parseInt(page),
        supportRequests: allSupportRequests,
      },
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: "fail",
      msg: error.message || "Something went wrong",
      stack: process.env.NODE_ENV === "development" ? error.stack : {},
    });
  }
};

const markAsResolved = async (req, res) => {
  const { id } = req.params;

  try {
    const updatedSupport = await Support.findByIdAndUpdate(
      id,
      { status: "resolved" },
      { new: true }
    );

    if (!updatedSupport) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: "fail",
        msg: "Support request not found",
      });
    }

    res.status(httpStatus.OK).json({
      status: "success",
      msg: "Support request marked as resolved",
      data: updatedSupport,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: "fail",
      msg: error.message || "Something went wrong",
      stack: process.env.NODE_ENV === "development" ? error.stack : {},
    });
  }
};

const deleteSupportRequestById = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedSupportRequest = await Support.findByIdAndDelete(id);

    if (!deletedSupportRequest) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: "fail",
        msg: "Support request not found",
      });
    }

    res.status(httpStatus.OK).json({
      status: "success",
      msg: "Support deleted successfully",
      data: deletedSupportRequest,
    });
  } catch (error) {
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: "fail",
      msg: error.message || "Something went wrong",
      stack: process.env.NODE_ENV === "development" ? error.stack : {},
    });
  }
};

const supportController = {
  createSupportRequest,
  getAllSupportRequests,
  markAsResolved,
  deleteSupportRequestById,
};

module.exports = supportController;
