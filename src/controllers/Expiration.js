const httpStatus = require("http-status");
const { Activation } = require("../models");

const VALID_DAYS = [15, 30, 45, 60, 90];

const getAllExpirations = async (req, res) => {
  const { days, page = 1, limit = 10, status } = req.query;
  const { role } = req.authUser;

  try {
    if (!VALID_DAYS.includes(parseInt(days))) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .send({ message: "INVALID DAYS FILTER" });
    }

    const today = new Date();
    const expirationDate = new Date();
    expirationDate.setDate(today.getDate() + parseInt(days));

    let query = {
      $expr: {
        $and: [
          { $gte: [{ $toDate: "$expiresOn" }, today] },
          { $lt: [{ $toDate: "$expiresOn" }, expirationDate] },
        ],
      },
    };

    if (role === "dealer") {
      query.dealer = req.authUser?._id;
    }

    if (status) {
      query.status = status;
    }

    const totalActivationsCount = await Activation.countDocuments(query);
    const totalPages = Math.ceil(totalActivationsCount / limit);

    const allExpirations = await Activation.find(query)
      .populate("dealer")
      .sort({
        expiresOn: -1,
      })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .exec();

    res.status(httpStatus.OK).json({
      status: "success",
      msg: "Fetched All Expirations",
      data: {
        totalResults: totalActivationsCount,
        totalPages: totalPages,
        currentPage: parseInt(page),
        expirations: allExpirations,
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

const expirationController = {
  getAllExpirations,
};

module.exports = expirationController;
