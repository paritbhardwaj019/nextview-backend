const httpStatus = require("http-status");
const { NFRKey, Dealer } = require("../models");
const { nodeEnv } = require("../config");
const excelReader = require("xlsx");

module.exports = {
  addNFRKeys: async (req, res) => {
    try {
      const file = excelReader.readFile(req.file.path);
      const sheetNames = file.SheetNames;
      const allData = [];

      for (let index = 0; index < sheetNames.length; index++) {
        const sheetName = sheetNames[index];
        const arr = excelReader.utils.sheet_to_json(file.Sheets[sheetName]);

        const formattedData = arr.map(({ LICENSE, KEY }) => ({
          licenseNo: LICENSE,
          licenseKey: KEY,
        }));

        allData.push(...formattedData);
      }

      await NFRKey.insertMany(allData);

      res.status(httpStatus.CREATED).json({
        status: "success",
        msg: "NFRKeys inserted successfully",
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
  assignDealerToNFRKey: async (req, res) => {
    try {
      const { id } = req.params;
      const { dealerId } = req.body;

      const nfrKey = await NFRKey.findById(id);
      const dealer = await Dealer.findById(dealerId);

      if (!nfrKey || !dealer) {
        return res.status(httpStatus.NOT_FOUND).json({
          status: "fail",
          msg: "NFRKey or dealer not found",
        });
      }

      nfrKey.dealer = dealer._id;
      await nfrKey.save();

      res.status(httpStatus.OK).json({
        status: "success",
        msg: "Dealer assigned to NFRKey successfully",
      });
    } catch (error) {
      console.error("Error assigning dealer to NFRKey:", error);
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: "Error assigning dealer to NFRKey",
        error: nodeEnv === "dev" ? error.message : {},
      });
    }
  },
  fetchAllNFRKeys: async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    try {
      const totalNFRKeysCount = await NFRKey.countDocuments();
      const totalPages = Math.ceil(totalNFRKeysCount / limit);

      const allNFRKeys = await NFRKey.find()
        .populate("dealer")
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      res.status(httpStatus.OK).json({
        status: "success",
        msg: "Fetched All NFRKeys",
        data: {
          totalResults: totalNFRKeysCount,
          totalPages: totalPages,
          currentPage: parseInt(page),
          nfrKeys: allNFRKeys,
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
};
