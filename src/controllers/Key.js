const httpStatus = require("http-status");
const { nodeEnv } = require("../config");
const excelReader = require("xlsx");
const { Activation, Key } = require("../models");
const fs = require("fs");
const extractKeyType = require("../utils/extractKeyType");
const containsNFR = require("../utils/containsNFR");

module.exports = {
  uploadKeys: async (req, res) => {
    try {
      const file = excelReader.readFile(req.file.path);
      const sheetNames = file.SheetNames;

      const bulkData = [];

      for (const sheetName of sheetNames) {
        const arr = excelReader.utils.sheet_to_json(file.Sheets[sheetName]);

        arr.forEach(
          ({
            ["sub_box_id"]: subBoxNo,
            license,
            key,
            ["main_box_number"]: mainBoxNo,
            ["product_type"]: type,
          }) => {
            const index = bulkData.findIndex(
              (item) =>
                item.subBoxNo === subBoxNo ||
                item.license === license ||
                item.key === key
            );

            if (index === -1) {
              bulkData.push({
                subBoxNo,
                license,
                key,
                type: extractKeyType(type),
                mainBoxNo,
                isNFR: containsNFR(type),
              });
            }
          }
        );
      }

      const existingActivations = await Activation.find({
        licenseNo: { $in: bulkData.map((data) => data.license) },
      });

      const existingKeys = await Key.find({
        $or: [
          { license: { $in: bulkData.map((data) => data.license) } },
          { key: { $in: bulkData.map((data) => data.key) } },
        ],
      });

      const filteredData = bulkData.filter(
        (data) =>
          !existingActivations.some(
            (activation) => activation.licenseNo === data.license
          ) &&
          !existingKeys.some(
            (existingKey) =>
              existingKey.license === data.license ||
              existingKey.key === data.key
          )
      );

      if (filteredData.length > 0) {
        await Key.insertMany(filteredData);
      }

      await fs.unlinkSync(req.file.path);

      res.status(httpStatus.CREATED).json({
        status: "success",
        msg: "Data inserted successfully",
      });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: "Error processing Excel file",
        stack: nodeEnv === "dev" ? error.stack : {},
      });
    }
  },

  fetchAllKeys: async (req, res) => {
    const { page = 1, limit = 10, status, search = "", type } = req.query;

    const currentPage = parseInt(page) || 1;
    const itemsPerPage = parseInt(limit) || 10;
    const searchQuery = search || "";

    try {
      let query = {};

      if (searchQuery) {
        query = {
          $or: [
            { license: { $regex: searchQuery, $options: "i" } },
            { key: { $regex: searchQuery, $options: "i" } },
            { subBoxNo: { $regex: searchQuery, $options: "i" } },
          ],
        };
      }

      if (status) {
        query.status = status;
      }

      if (type) {
        query.type = type;
      }

      const totalKeysCount = await Key.countDocuments(query);
      const totalPages = Math.ceil(totalKeysCount / itemsPerPage);

      let allKeys;

      if (searchQuery) {
        allKeys = await Key.find(query).exec();
      } else {
        allKeys = await Key.find(query)
          .limit(itemsPerPage)
          .skip((currentPage - 1) * itemsPerPage)
          .exec();
      }

      res.status(httpStatus.OK).json({
        status: "success",
        msg: "Fetched All Keys",
        data: {
          totalResults: totalKeysCount,
          totalPages: searchQuery ? 1 : totalPages,
          currentPage: searchQuery ? 1 : currentPage,
          keys: allKeys,
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

  deleteKey: async (req, res) => {
    const { id } = req.params;
    try {
      const key = await Key.findById(id);
      if (!key) {
        return res.status(httpStatus.NOT_FOUND).json({
          status: "fail",
          msg: "Key not found",
        });
      }

      await Key.deleteOne({ _id: id });

      res.status(httpStatus.OK).json({
        status: "success",
        msg: "Key deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting key:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: "Error deleting key",
        stack: nodeEnv === "dev" ? error.stack : {},
      });
    }
  },
};
