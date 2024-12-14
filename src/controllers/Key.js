const httpStatus = require("http-status");
const { nodeEnv } = require("../config");
const excelReader = require("xlsx");
const { Activation, Key } = require("../models");
const fs = require("fs");
const extractKeyType = require("../utils/extractKeyType");
const containsNFR = require("../utils/containsNFR");

const isValidKeyFormat = (data) => {
  const mainBoxPattern = /^KA\d{2}-\d{4}-[A-Z]{2}-\d{3}$/;

  const subBoxPattern = /^KA\d{2}-\d{4}-[A-Z]{2}-\d{3}-[A-Z]\d{2}$/;

  const licensePattern = /^KAV\d{9}$/;

  const keyPattern = /^\d{8}$/;

  return {
    isValid:
      mainBoxPattern.test(data.mainBoxNo) &&
      subBoxPattern.test(data.subBoxNo) &&
      licensePattern.test(data.license) &&
      keyPattern.test(data.key),
    errors: {
      mainBoxNo: !mainBoxPattern.test(data.mainBoxNo)
        ? "Invalid main box number format"
        : null,
      subBoxNo: !subBoxPattern.test(data.subBoxNo)
        ? "Invalid sub box number format"
        : null,
      license: !licensePattern.test(data.license)
        ? "Invalid license format"
        : null,
      key: !keyPattern.test(data.key) ? "Invalid key format" : null,
    },
  };
};

module.exports = {
  uploadKeys: async (req, res) => {
    try {
      const file = excelReader.readFile(req.file.path);
      const sheetNames = file.SheetNames;

      const bulkData = [];
      const invalidEntries = [];

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
            const keyData = {
              subBoxNo,
              license,
              key,
              mainBoxNo,
              type: extractKeyType(type),
              isNFR: containsNFR(type),
            };

            const validation = isValidKeyFormat(keyData);

            if (!validation.isValid) {
              invalidEntries.push({
                ...keyData,
                errors: validation.errors,
              });
              return;
            }

            const index = bulkData.findIndex(
              (item) =>
                item.subBoxNo === subBoxNo ||
                item.license === license ||
                item.key === key
            );

            if (index === -1) {
              bulkData.push(keyData);
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

      fs.unlinkSync(req.file.path);

      res.status(httpStatus.CREATED).json({
        status: "success",
        msg: "Data inserted successfully",
        summary: {
          totalProcessed: arr.length,
          validKeysUploaded: filteredData.length,
          invalidEntries: invalidEntries.length,
          duplicatesSkipped: bulkData.length - filteredData.length,
        },
        invalidEntries: invalidEntries.length > 0 ? invalidEntries : undefined,
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

  deleteKeyById: async (req, res) => {
    const { id } = req.params;

    try {
      const deletedKey = await Key.findByIdAndDelete(id);

      await Activation.deleteMany({ _id: deletedKey.license });

      if (!deletedKey) {
        return res.status(httpStatus.NOT_FOUND).json({
          status: "fail",
          msg: "Key not found",
        });
      }

      res.status(httpStatus.OK).json({
        status: "success",
        msg: "Key deleted successfully",
        data: deletedKey,
      });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: "Error deleting activation",
        stack: nodeEnv === "dev" ? error.stack : {},
      });
    }
  },
};
