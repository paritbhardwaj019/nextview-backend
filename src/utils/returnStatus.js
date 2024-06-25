const returnStatus = (expiresOn) => {
  if (!expiresOn) return;

  const daysLeft = Math.ceil((new Date(expiresOn) - new Date()) / 86400000);

  const status = daysLeft > 0 ? "active" : "expired";

  return status;
};

module.exports = returnStatus;
