const httpStatus = require("http-status");
const { Activation, Dealer, Key } = require("../models");
const { nodeEnv } = require("../config");
const fs = require("fs");
const csv = require("fast-csv");
const extractKeyType = require("../utils/extractKeyType");
const isValidPhoneNumber = require("../utils/isValidPhoneNumber");
const isValidPincode = require("../utils/isValidPincode");
const containsNFR = require("../utils/containsNFR");

module.exports = {
  fetchAllActivations: async (req, res) => {
    const {
      page = 1,
      limit = 10,
      search = "",
      startDate = "",
      endDate = "",
      status = "",
      type = null,
    } = req.query;

    const { role } = req.authUser;

    try {
      let match = {};

      if (search) {
        match.$or = [
          { licenseKey: { $regex: search, $options: "i" } },
          { licenseNo: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { name: { $in: [new RegExp(search, "i")] } },
          { phone: { $in: [new RegExp(search, "i")] } },
          { dealerPhone: { $in: [new RegExp(search, "i")] } },
          { "keyDetails.subBoxNo": { $regex: search, $options: "i" } },
          { "keyDetails.mainBoxNo": { $regex: search, $options: "i" } },
        ];
      }

      if (role === "dealer") {
        match.dealer = req.authUser?._id;
      }

      if (type) {
        match.type = type;
      }

      const currentDate = new Date();

      if (status === "active") {
        match.expiresOn = { $gte: { $toDate: "$expiresOn" }, currentDate };
      } else if (status === "expired") {
        match.expiresOn = { $lt: { $toDate: "$expiresOn" }, currentDate };
      }

      let aggregation = [
        {
          $lookup: {
            from: "keys",
            localField: "key",
            foreignField: "_id",
            as: "keyDetails",
          },
        },
        { $unwind: "$keyDetails" },
        {
          $project: {
            _id: 1,
            licenseKey: 1,
            licenseNo: 1,
            name: 1,
            email: 1,
            phone: 1,
            dealerPhone: 1,
            purchasedOn: 1,
            expiresOn: 1,
            status: 1,
            dealer: 1,
            type: 1,
            isNFR: 1,
            city: 1,
            district: 1,
            pinCode: 1,
            "keyDetails.subBoxNo": 1,
            "keyDetails.mainBoxNo": 1,
            "keyDetails.isNFR": 1,
          },
        },
        {
          $match: match,
        },
        { $sort: { purchasedOn: -1 } },
      ];

      if (!search) {
        aggregation = [
          ...aggregation,
          { $skip: (page - 1) * +limit },
          { $limit: +limit },
        ];
      }

      const [totalActivationsCount, allActivations] = await Promise.all([
        Activation.countDocuments(match),
        Activation.aggregate(aggregation),
      ]);

      const totalPages = Math.ceil(totalActivationsCount / limit);

      res.status(httpStatus.OK).json({
        status: "success",
        msg: "Fetched All Activations",
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
        if (isValidPhoneNumber(data["Dealer Name"])) {
          activations.push({
            licenseNo: data["License"],
            licenseKey: data["Key"],
            name: data["customer Name"],
            phone: data["customer Phone"],
            email: data["Email"],
            type: extractKeyType(data["Product Type"]),
            purchasedOn: data["Activated"],
            expiresOn: data["Expiration"],
            dealerPhoneNumber: data["Dealer Name"],
            dealerPhone: data["Dealer Name"],
            city: data["City"],
            district: data["District"],
            pinCode: isValidPincode(data["PIN"]) ? data["PIN"] : null,
            isNFR: containsNFR(data["Product Type"]),
          });
        }
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

      const licenseNumbers = activations.map((a) => a.licenseNo);
      const existingActivations = await Activation.find({
        licenseNo: { $in: licenseNumbers },
      }).lean();

      const existingKeys = existingActivations.map((a) => a.licenseNo);

      const keys = await Key.find({
        license: { $in: licenseNumbers },
      }).lean();

      const keyMap = keys.reduce((map, key) => {
        map[key.license] = key._id;
        return map;
      }, {});

      const newActivations = activations
        .filter((activation) => !existingKeys.includes(activation.licenseNo))
        .map((activation) => ({
          ...activation,
          dealer: dealerMap[activation.dealerPhoneNumber],
          key: keyMap[activation.licenseNo],
        }));

      await Promise.all([
        Activation.insertMany(newActivations),
        Key.updateMany(
          { license: { $in: licenseNumbers } },
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

  editActivationById: async (req, res) => {
    const { id } = req.params;
    const { dealerPhone, ...rest } = req.body;

    delete req.body?._id;

    try {
      let dealerId = null;

      if (dealerPhone) {
        const dealer = await Dealer.findOne({ phoneNumber: dealerPhone });

        if (dealer) {
          dealerId = dealer._id;
        }
      }

      const updatedActivation = await Activation.findByIdAndUpdate(
        id,
        { ...rest, dealerPhone, dealer: dealerId },
        { new: true }
      );

      if (!updatedActivation) {
        return res.status(httpStatus.NOT_FOUND).json({
          status: "fail",
          msg: "Activation not found",
        });
      }

      res.status(httpStatus.OK).json({
        status: "success",
        msg: "Activation updated successfully",
        data: updatedActivation,
      });
    } catch (error) {
      console.log(error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: "Error updating activation",
        stack: process.env.NODE_ENV === "dev" ? error.stack : {},
      });
    }
  },

  deleteActivationById: async (req, res) => {
    const { id } = req.params;

    try {
      const deletedActivation = await Activation.findByIdAndDelete(id);

      await Key.updateOne(
        { _id: deletedActivation.key },
        {
          $set: {
            status: "deactivated",
          },
        }
      );

      if (!deletedActivation) {
        return res.status(httpStatus.NOT_FOUND).json({
          status: "fail",
          msg: "Activation not found",
        });
      }

      res.status(httpStatus.OK).json({
        status: "success",
        msg: "Activation deleted successfully",
        data: deletedActivation,
      });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: "Error deleting activation",
        stack: nodeEnv === "dev" ? error.stack : {},
      });
    }
  },

  getActivationsByDealerId: async (req, res) => {
    const { id } = req.params;

    try {
      const activations = await Activation.find({
        dealerPhone: id,
      });

      if (!activations) {
        return res.status(httpStatus.NOT_FOUND).json({
          status: "fail",
          msg: "No activations found for the provided dealer id",
        });
      }

      res.status(httpStatus.OK).json({
        status: "success",
        data: activations,
      });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: "Error fetching activations",
        stack: nodeEnv === "dev" ? error.stack : {},
      });
    }
  },
};
