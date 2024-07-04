function isValidPincode(pincode) {
  const pincodePattern = /^\d{6}$/;
  return pincodePattern.test(pincode);
}

module.exports = isValidPincode;
