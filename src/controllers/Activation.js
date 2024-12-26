const httpStatus = require("http-status");
const { Activation, Dealer, Key } = require("../models");
const { nodeEnv } = require("../config");
const fs = require("fs");
const csv = require("fast-csv");
const extractKeyType = require("../utils/extractKeyType");
const isValidPhoneNumber = require("../utils/isValidPhoneNumber");
const isValidPincode = require("../utils/isValidPincode");
const containsNFR = require("../utils/containsNFR");
const { parse, isBefore, isAfter, startOfDay, format } = require("date-fns");

var mongoose = require("mongoose");
const { parseExpiryDate } = require("../utils/parseExpiryDate");

var ObjectId = mongoose.Types.ObjectId;

module.exports = {
  // fetchAllActivations: async (req, res) => {
  //   const {
  //     page = 1,
  //     limit = 10,
  //     search = "",
  //     startDate = "",
  //     endDate = "",
  //     status = "",
  //     type = null,
  //   } = req.query;

  //   const { role } = req.authUser;

  //   try {
  //     let match = {};

  // if (search) {
  //   match.$or = [
  //     { licenseKey: { $regex: search, $options: "i" } },
  //     { licenseNo: { $regex: search, $options: "i" } },
  //     { email: { $regex: search, $options: "i" } },
  //     { name: { $in: [new RegExp(search, "i")] } },
  //     { phone: { $in: [new RegExp(search, "i")] } },
  //     { dealerPhone: { $in: [new RegExp(search, "i")] } },
  //     { "keyDetails.subBoxNo": { $regex: search, $options: "i" } },
  //     { "keyDetails.mainBoxNo": { $regex: search, $options: "i" } },
  //   ];
  // }

  //     if (role === "dealer") {
  //       if (ObjectId.isValid(req.authUser?._id)) {
  //         match.dealer = new ObjectId(req.authUser._id);
  //       } else {
  //         return res.status(httpStatus.BAD_REQUEST).json({
  //           status: "fail",
  //           msg: "Invalid dealer ID.",
  //         });
  //       }
  //     }

  //     if (type) {
  //       match.type = type;
  //     }

  // const currentDate = new Date();

  // if (status === "active") {
  //   match.expiresOn = { $gte: { $toDate: "$expiresOn" }, currentDate };
  // } else if (status === "expired") {
  //   match.expiresOn = { $lt: { $toDate: "$expiresOn" }, currentDate };
  // }

  //     if (startDate) {
  //       match.purchasedOn = { $gte: new Date(startDate) };
  //     }

  //     if (endDate) {
  //       match.purchasedOn = { ...match.purchasedOn, $lte: new Date(endDate) };
  //     }

  //     let aggregation = [
  //       {
  //         $lookup: {
  //           from: "keys", // Collection name for keys
  //           localField: "key",
  //           foreignField: "_id",
  //           as: "keyDetails",
  //         },
  //       },
  //       { $unwind: "$keyDetails" },
  //       {
  //         $lookup: {
  //           from: "dealers", // Collection name for dealers
  //           localField: "dealer",
  //           foreignField: "_id",
  //           as: "dealerDetails",
  //         },
  //       },
  //       { $unwind: "$dealerDetails" }, // Unwind to convert dealerDetails array to object
  //       {
  //         $project: {
  //           _id: 1,
  //           licenseKey: 1,
  //           licenseNo: 1,
  //           name: 1,
  //           email: 1,
  //           phone: 1,
  //           dealerPhone: 1,
  //           purchasedOn: 1,
  //           expiresOn: 1,
  //           status: 1,
  //           dealer: "$dealerDetails", // Replace dealer ObjectId with dealerDetails object
  //           type: 1,
  //           isNFR: 1,
  //           city: 1,
  //           district: 1,
  //           pinCode: 1,
  //           "keyDetails.subBoxNo": 1,
  //           "keyDetails.mainBoxNo": 1,
  //           "keyDetails.isNFR": 1,
  //         },
  //       },
  //       {
  //         $match: match,
  //       },
  //       { $sort: { purchasedOn: -1 } },
  //     ];

  //     console.log("MATCH", match);

  //     if (!search) {
  //       aggregation = [
  //         ...aggregation,
  //         { $skip: (page - 1) * +limit },
  //         { $limit: +limit },
  //       ];
  //     }

  //     const [totalActivationsCount, allActivations] = await Promise.all([
  //       Activation.countDocuments(match),
  //       Activation.aggregate(aggregation),
  //     ]);

  //     const totalPages = Math.ceil(totalActivationsCount / limit);

  //     res.status(httpStatus.OK).json({
  //       status: "success",
  //       msg: "Fetched All Activations",
  //       data: {
  //         totalResults: totalActivationsCount,
  //         totalPages: totalPages,
  //         currentPage: parseInt(page),
  //         activations: allActivations,
  //       },
  //     });
  //   } catch (error) {
  //     console.log(error);
  //     res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
  //       status: "fail",
  //       msg: error.message || "Something went wrong",
  //       stack: nodeEnv === "dev" ? error.stack : {},
  //     });
  //   }
  // },
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

    const { role, _id: authUserId } = req.authUser;

    try {
      const match = {};
      const hasFilters = !!(search || startDate || endDate || status || type);

      if (search) {
        const searchRegex = new RegExp(
          search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&"),
          "i"
        );
        match.$or = [
          { licenseKey: searchRegex },
          { licenseNo: searchRegex },
          { email: searchRegex },
          { name: searchRegex },
          { phone: searchRegex },
          { dealerPhone: searchRegex },
          { "keyDetails.subBoxNo": searchRegex },
          { "keyDetails.mainBoxNo": searchRegex },
        ];
      }

      if (role === "dealer") {
        if (!ObjectId.isValid(authUserId)) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: "fail",
            msg: "Invalid dealer ID.",
          });
        }
        match.dealer = new ObjectId(authUserId);
      }

      if (type) {
        match.type = type;
      }

      if (status) {
        const currentDate = new Date();
        match.expiresOn =
          status === "active" ? { $gte: currentDate } : { $lt: currentDate };
      }

      if (startDate || endDate) {
        match.purchasedOn = {};
        if (startDate) match.purchasedOn.$gte = new Date(startDate);
        if (endDate) match.purchasedOn.$lte = new Date(endDate);
      }

      const aggregationPipeline = [
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
          $lookup: {
            from: "dealers",
            localField: "dealer",
            foreignField: "_id",
            as: "dealerDetails",
          },
        },
        {
          $addFields: {
            dealerDetails: {
              $cond: {
                if: { $eq: [{ $size: "$dealerDetails" }, 0] },
                then: [
                  {
                    _id: null,
                    name: null,
                    phone: null,
                    email: null,
                    address: null,
                    city: null,
                    district: null,
                    state: null,
                    pinCode: null,
                    isActive: null,
                    isApproved: null,
                  },
                ],
                else: "$dealerDetails",
              },
            },
          },
        },
        { $unwind: "$dealerDetails" },
        { $match: match },
        {
          $project: {
            _id: 1,
            licenseNo: 1,
            licenseKey: 1,
            name: 1,
            email: 1,
            phone: 1,
            purchasedOn: 1,
            expiresOn: 1,
            dealer: 1,
            type: 1,
            isNFR: 1,
            city: 1,
            district: 1,
            pinCode: 1,
            dealerPhone: 1,
            key: 1,
            createdAt: 1,
            updatedAt: 1,
            keyDetails: 1,
            dealerDetails: {
              _id: "$dealerDetails._id",
              name: "$dealerDetails.ownerName",
              phone: "$dealerDetails.phoneNumber",
              email: "$dealerDetails.email",
              address: "$dealerDetails.address",
              city: "$dealerDetails.city",
              gstInNumber: "$dealerDetails.gstInNumber",
              district: "$dealerDetails.district",
              state: "$dealerDetails.state",
              pinCode: "$dealerDetails.pinCode",
              isActive: "$dealerDetails.isActive",
              isApproved: "$dealerDetails.isApproved",
            },
          },
        },
        {
          $facet: {
            metadata: [{ $count: "totalActivationsCount" }],
            activations: [
              { $sort: { purchasedOn: -1 } },
              ...(hasFilters
                ? []
                : [
                    { $skip: (parseInt(page) - 1) * parseInt(limit) },
                    { $limit: parseInt(limit) },
                  ]),
            ],
          },
        },
      ];

      const [result] = await Activation.aggregate(aggregationPipeline);

      const totalActivationsCount =
        result.metadata[0]?.totalActivationsCount || 0;
      const totalPages = Math.ceil(totalActivationsCount / parseInt(limit));

      res.status(httpStatus.OK).json({
        status: "success",
        msg: "Fetched All Activations",
        data: {
          totalResults: totalActivationsCount,
          totalPages,
          currentPage: hasFilters ? 1 : parseInt(page),
          activations: result.activations,
        },
      });
    } catch (error) {
      console.error("Error in fetchAllActivations:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: "An unexpected error occurred while fetching activations.",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
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

  downloadAllActivations: async (req, res) => {
    const { role, _id: authUserId } = req.authUser;

    try {
      const match = {};
      if (role === "dealer") {
        if (!ObjectId.isValid(authUserId)) {
          return res.status(httpStatus.BAD_REQUEST).json({
            status: "fail",
            msg: "Invalid dealer ID.",
          });
        }
        match.dealer = new ObjectId(authUserId);
      }

      const aggregationPipeline = [
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
          $lookup: {
            from: "dealers",
            localField: "dealer",
            foreignField: "_id",
            as: "dealerDetails",
          },
        },
        { $unwind: "$dealerDetails" },
        { $match: match },
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
            dealer: "$dealerDetails",
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
        { $sort: { purchasedOn: -1 } },
      ];

      const allActivations = await Activation.aggregate(aggregationPipeline);

      if (!allActivations || allActivations.length === 0) {
        return res.status(httpStatus.NOT_FOUND).json({
          status: "fail",
          msg: "No activations found.",
        });
      }

      const baseHeaders = [
        "ID",
        "LICENSE NO",
        "LICENSE KEY",
        "NAME",
        "EMAIL",
        "PRODUCT TYPE",
        "PURCHASED ON",
        "EXPIRES ON",
        "STATUS",
        "CITY",
        "DISTRICT",
        "PIN CODE",
        "SUB BOX NO",
        "MAIN BOX NO",
        "IS NFR",
      ];

      const headers =
        role === "dealer"
          ? baseHeaders
          : [
              ...baseHeaders.slice(0, 5),
              "DEALER PHONE",
              ...baseHeaders.slice(5),
            ];

      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="Activations-${
          new Date().toISOString().split("T")[0]
        }.csv"`
      );

      const csvStream = csv.format({ headers: headers });
      csvStream.pipe(res);

      allActivations.forEach((activation, index) => {
        const baseData = {
          ID: index + 1,
          "LICENSE NO": activation.licenseNo,
          "LICENSE KEY": activation.licenseKey,
          NAME: activation.name,
          EMAIL: activation.email,
          "PRODUCT TYPE": activation.type,
          "PURCHASED ON": `="${format(
            new Date(activation.purchasedOn),
            "dd/MM/yyyy"
          )}"`,
          "EXPIRES ON": `="${format(
            new Date(activation.expiresOn),
            "dd/MM/yyyy"
          )}"`,
          STATUS:
            new Date(activation.expiresOn) >= new Date() ? "ACTIVE" : "EXPIRED",
          CITY: activation.city,
          DISTRICT: activation.district,
          "PIN CODE": activation.pinCode || "",
          "SUB BOX NO": activation.keyDetails.subBoxNo || "",
          "MAIN BOX NO": activation.keyDetails.mainBoxNo || "",
          "IS NFR": activation.isNFR ? "YES" : "NO",
        };

        const rowData =
          role === "dealer"
            ? baseData
            : {
                ...Object.fromEntries(Object.entries(baseData).slice(0, 5)),
                "DEALER PHONE": `="${activation.dealerPhone}"`,
                ...Object.fromEntries(Object.entries(baseData).slice(5)),
              };

        csvStream.write(rowData);
      });

      csvStream.end();
    } catch (error) {
      console.log(error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: "An unexpected error occurred while downloading activations.",
        stack: nodeEnv === "dev" ? error.stack : {},
      });
    }
  },
};
