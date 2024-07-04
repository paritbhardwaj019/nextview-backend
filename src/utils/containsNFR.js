function containsNFR(input) {
  const parts = input.split(" ");
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].toUpperCase() === "NFR") {
      return true;
    }
  }
  return false;
}

module.exports = containsNFR;
