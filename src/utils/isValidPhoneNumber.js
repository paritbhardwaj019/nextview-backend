function isValidPhoneNumber(phoneNumber) {
  const phoneNumberPattern = /^\d{10}$/;
  return phoneNumberPattern.test(phoneNumber);
}

module.exports = isValidPhoneNumber;
