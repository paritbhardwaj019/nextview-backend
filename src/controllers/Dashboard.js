const httpStatus = require("http-status");
const Activation = require("../models/Activation");

module.exports = {
  getDashboardStats: async (req, res) => {
    try {
      const user = req.authUser;

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      );
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      const activationsThisMonth = await Activation.countDocuments({
        dealer: user._id,
        $expr: {
          $and: [
            { $gte: [{ $toDate: "$purchasedOn" }, currentMonthStart] },
            { $lt: [{ $toDate: "$purchasedOn" }, now] },
          ],
        },
      });

      const activationsLastMonth = await Activation.countDocuments({
        dealer: user._id,
        $expr: {
          $and: [
            { $gte: [{ $toDate: "$purchasedOn" }, previousMonthStart] },
            { $lt: [{ $toDate: "$purchasedOn" }, previousMonthEnd] },
          ],
        },
      });

      const percentageIncrease =
        activationsLastMonth === 0
          ? activationsThisMonth > 0
            ? 100
            : 0
          : ((activationsThisMonth - activationsLastMonth) /
              activationsLastMonth) *
            100;

      res.json({
        activationsThisMonth,
        percentageIncrease: parseFloat(percentageIncrease).toFixed(2),
      });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: error.message || "Something went wrong",
      });
    }
  },
};
