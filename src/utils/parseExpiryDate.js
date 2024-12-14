const { parse } = require("date-fns");

function parseExpiryDate(dateString) {
  return parse(dateString, "dd-MMM-yy", new Date());
}

module.exports = {
  parseExpiryDate,
};
