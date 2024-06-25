const httpStatus = require("http-status");
const { Activation, Dealer, Key } = require("../models");
const { nodeEnv } = require("../config");
const fs = require("fs");
const csv = require("fast-csv");

module.exports = {
  fetchAllActivations: async (req, res) => {
    const {
      page = 1,
      limit = 10,
      search = "",
      startDate = "",
      endDate = "",
      status = "",
    } = req.query;

    const { role } = req.authUser;

    try {
      let query = {};

      if (search) {
        query = {
          $or: [
            { licenseKey: { $regex: search, $options: "i" } },
            { licenseNo: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { name: { $in: [new RegExp(search, "i")] } },
          ],
        };
      }

      if (startDate && endDate) {
        query.purchasedOn = {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        };
      } else if (startDate) {
        query.purchasedOn = { $gte: new Date(startDate) };
      } else if (endDate) {
        query.purchasedOn = { $lte: new Date(endDate) };
      }

      if (role === "dealer") {
        query.dealer = req.authUser?._id;
      }

      const currentDate = new Date();

      if (status === "active") {
        query.$expr = { $gte: [{ $toDate: "$expiresOn" }, currentDate] };
      } else if (status === "expired") {
        query.$expr = { $lt: [{ $toDate: "$expiresOn" }, currentDate] };
      }

      const totalActivationsCount = await Activation.countDocuments(query);
      const totalPages = Math.ceil(totalActivationsCount / limit);

      const allActivations = await Activation.find(query)
        .populate("dealer")
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      res.status(httpStatus.OK).json({
        status: "success",
        msg: "Fetched All Activation",
        data: {
          totalResults: totalActivationsCount,
          totalPages: totalPages,
          currentPage: parseInt(page),
          activations: allActivations,
        },
      });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: error.message || "Something went wrong",
        stack: nodeEnv === "dev" ? error.stack : {},
      });
    }
  },

  uploadActivations: async (req, res) => {
    if (!req.file.path) {
      return res.status(httpStatus.NOT_FOUND).json({
        status: "fail",
        msg: "File not added",
      });
    }

    try {
      const activations = [];
      const parseStream = fs
        .createReadStream(req.file.path)
        .pipe(csv.parse({ headers: true }));

      for await (const data of parseStream) {
        activations.push({
          licenseNo: data["License"],
          licenseKey: data["Key"],
          name: data["Full Name"],
          phone: data["Mobile Number"],
          email: data["Email Address"],
          type: (data["Product Type"] || "").split(" ")[0].toLowerCase(),
          purchasedOn: data["Activated Date"],
          expiresOn: data["Expires Date"],
          dealerPhoneNumber: data["Dealer Phone Number"],
        });
      }

      const dealerPhoneNumbers = activations
        .map((a) => a.dealerPhoneNumber)
        .filter(Boolean);
      const dealers = await Dealer.find({
        phoneNumber: { $in: dealerPhoneNumbers },
      }).lean();

      const dealerMap = dealers.reduce((map, dealer) => {
        map[dealer.phoneNumber] = dealer._id;
        return map;
      }, {});

      const newActivations = activations.map((activation) => ({
        ...activation,
        dealer: dealerMap[activation.dealerPhoneNumber],
      }));

      await Promise.all([
        Activation.insertMany(newActivations),
        Key.updateMany(
          { license: { $in: activations.map((a) => a.licenseNo) } },
          { $set: { status: "activated" } }
        ),
      ]);

      fs.unlinkSync(req.file.path);

      res.status(httpStatus.CREATED).json({
        status: "success",
        msg: "Data inserted successfully",
      });
    } catch (error) {
      console.log(error);

      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: "Error processing CSV file",
        stack: nodeEnv === "dev" ? error.stack : {},
      });
    }
  },
};
