const httpStatus = require("http-status");
const { Activation } = require("../models");
const excelReader = require("xlsx");
const { nodeEnv } = require("../config");

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

      if (status) {
        query.status = { $regex: new RegExp(`^${status}$`, "i") };
      }

      const totalActivationsCount = await Activation.countDocuments(query);
      const totalPages = Math.ceil(totalActivationsCount / limit);

      const allActivations = await Activation.find(query)
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
    try {
      const file = excelReader.readFile(req.file.path);
      const sheetNames = file.SheetNames;
      const allData = [];

      for (let index = 0; index < sheetNames.length; index++) {
        const sheetName = sheetNames[index];
        const arr = excelReader.utils.sheet_to_json(file.Sheets[sheetName]);

        const formattedData = arr.map(
          ({
            LICENSE,
            KEY,
            NAME,
            STATUS,
            ["EMAIL ADDRESS"]: emailAdress,
            ["DEALER CODE"]: dealerCode,
            ["PHONE NUMBER"]: phoneNumber,
            ["PRODUCT NAME"]: productName,
            ["PURCHASED ON"]: purchasedOn,
          }) => ({
            licenseNo: LICENSE,
            licenseKey: KEY,
            name: NAME,
            email: emailAdress,
            dealerCode,
            phone: phoneNumber,
            productName,
            purchasedOn,
            status: STATUS,
          })
        );

        allData.push(...formattedData);
      }

      await Activation.insertMany(allData);

      res.status(httpStatus.CREATED).json({
        status: "success",
        msg: "Data inserted successfully",
      });
    } catch (error) {
      console.error("Error processing Excel file:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: "Error processing Excel file",
        error: nodeEnv === "dev" ? error.message : {},
      });
    }
  },
};
