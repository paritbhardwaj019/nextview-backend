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
            { phone: { $in: [new RegExp(search, "i")] } },
            { dealerPhone: { $in: [new RegExp(search, "i")] } },
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

      let activationQuery = Activation.find(query).populate("dealer key");

      if (!search) {
        activationQuery = activationQuery
          .limit(limit * 1)
          .skip((page - 1) * limit);
      }

      const allActivations = await activationQuery.exec();

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
            purchasedOn: data["Activated "],
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
      const keys = await Key.find({
        license: { $in: licenseNumbers },
      }).lean();

      const keyMap = keys.reduce((map, key) => {
        map[key.license] = key._id;
        return map;
      }, {});

      const newActivations = activations.map((activation) => ({
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

      await fs.unlinkSync(req.file.path);

      res.status(httpStatus.CREATED).json({
        status: "success",
        msg: "Data inserted successfully",
      });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: "Error processing CSV file",
        stack: nodeEnv === "dev" ? error.stack : {},
      });
    }
  },
};
