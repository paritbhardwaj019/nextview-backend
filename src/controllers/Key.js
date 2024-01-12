const httpStatus = require("http-status");
const { nodeEnv } = require("../config");
const excelReader = require("xlsx");
const { Activation, Key } = require("../models");

module.exports = {
  uploadKeys: async (req, res) => {
    const { type } = req.body;
    try {
      const file = excelReader.readFile(req.file.path);
      const sheetNames = file.SheetNames;
      const allData = [];
      const count = await Key.countDocuments();

      const sheetProcessingPromises = sheetNames.map(
        async (sheetName, index) => {
          const arr = excelReader.utils.sheet_to_json(file.Sheets[sheetName]);

          const formattedData = arr.map(
            async (
              { ["Box No"]: boxNo, LICENSE: license, KEY: key },
              innerIndex
            ) => {
              const existingActivation = await Activation.findOne({
                licenseNo: license,
              });

              if (!existingActivation) {
                return {
                  boxNo,
                  license,
                  key,
                  type,
                  seq: count + index * arr.length + innerIndex + 1,
                };
              }

              return null;
            }
          );

          allData.push(...formattedData);
        }
      );

      await Promise.all(sheetProcessingPromises);

      const filteredData = allData.filter((entry) => entry !== undefined);

      if (filteredData.length > 0) {
        await Key.insertMany(filteredData);
      }

      await fs.unlink(req.file.path);

      res.status(httpStatus.CREATED).json({
        status: "success",
        msg: "Data inserted successfully",
      });
    } catch (error) {
      console.error("Error processing Excel file:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: "Error processing Excel file",
        stack: nodeEnv === "dev" ? error.stack : {},
      });
    }
  },

  fetchAllKeys: async (req, res) => {
    const { page = 1, limit = 10, search = "" } = req.query;

    try {
      let query = {};

      if (search) {
        query = {
          $or: [
            { license: { $regex: search, $options: "i" } },
            { key: { $regex: search, $options: "i" } },
          ],
        };
      }

      const totalKeysCount = await Key.countDocuments(query);
      const totalPages = Math.ceil(totalKeysCount / limit);

      const allKeys = await Key.find(query)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      res.status(httpStatus.OK).json({
        status: "success",
        msg: "Fetched All Keys",
        data: {
          totalResults: totalKeysCount,
          totalPages: totalPages,
          currentPage: parseInt(page),
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

      await Key.updateMany({ seq: { $gt: key.seq } }, { $inc: { seq: -1 } });

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
