module.exports = (purchasedOnDate) => {
  var purchasedOnDate = new Date(purchasedOnDate);
  const daysToAdd = 365;

  purchasedOnDate.setDate(purchasedOnDate.getDate() + daysToAdd);
  const expirationDate = purchasedOnDate.toISOString().split("T")[0];

  const dateDifferenceInDays = Math.floor(
    (new Date(expirationDate) - new Date()) / (1000 * 60 * 60 * 24)
  );

  return dateDifferenceInDays < 0 ? 0 : dateDifferenceInDays;
};
