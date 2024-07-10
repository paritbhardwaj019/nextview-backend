const httpStatus = require("http-status");
const { Activation } = require("../models");

module.exports = {
  getAllDashboardData: async (req, res) => {
    try {
      const date = new Date();

      const firstDayOfCurrentMonth = new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      );

      const lastDayOfCurrentMonth = new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0
      );

      const firstDayOfLastMonth = new Date(
        date.getFullYear(),
        date.getMonth() - 1,
        1
      );

      const lastDayOfLastMonth = new Date(
        date.getFullYear(),
        date.getMonth(),
        0
      );

      const dealerFilter =
        req?.authUser?.role === "dealer" ? { dealer: req.authUser._id } : {};

      const allActivationsOfThisMonth = await Activation.find({
        ...dealerFilter,
        $expr: {
          $and: [
            { $gte: [{ $toDate: "$purchasedOn" }, firstDayOfCurrentMonth] },
            { $lt: [{ $toDate: "$purchasedOn" }, lastDayOfCurrentMonth] },
          ],
        },
      });

      const allActivationsOfLastMonth = await Activation.find({
        ...dealerFilter,
        $expr: {
          $and: [
            { $gte: [{ $toDate: "$purchasedOn" }, firstDayOfLastMonth] },
            { $lt: [{ $toDate: "$purchasedOn" }, lastDayOfLastMonth] },
          ],
        },
      });

      const latestActivations = await Activation.find(dealerFilter)
        .sort({ purchasedOn: -1 })
        .limit(10);

      const thiryDaysAfterToday = new Date(
        date.getFullYear(),
        date.getMonth(),
        30
      );

      const upcomingExpirationsInThirtyDays = await Activation.find({
        ...dealerFilter,
        $expr: {
          $and: [
            { $gte: [{ $toDate: "$expiresOn" }, date] },
            { $lt: [{ $toDate: "$expiresOn" }, thiryDaysAfterToday] },
          ],
        },
      });

      const totalActivations = await Activation.find(dealerFilter);

      const totalActivationsThisMonth = allActivationsOfThisMonth.length;
      const totalActivationsLastMonth = allActivationsOfLastMonth.length;

      const percentageBetweenLastMonthAndCurrentMonth =
        ((totalActivationsThisMonth - totalActivationsLastMonth) /
          totalActivationsLastMonth) *
        100;

      res.status(200).json({
        status: "success",
        data: {
          allActivationsOfThisMonth: totalActivationsThisMonth,
          percentageBetweenLastMonthAndCurrentMonth,
          latestActivations,
          upcomingExpirationsInThirtyDays:
            upcomingExpirationsInThirtyDays.length,
          totalActivations: totalActivations?.length,
        },
      });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        status: "fail",
        msg: error.message || "Something went wrong",
      });
    }
  },
};
