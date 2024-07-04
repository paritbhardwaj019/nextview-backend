function extractKeyType(input) {
  const parts = input.split(" ");
  let kavachType = "";
  let year = "";

  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith("KAVACH")) {
      kavachType = parts[i] + " " + parts[i + 1];
    }
    if (parts[i].includes("1YEAR")) {
      year = "1 YEAR";
      break;
    }
    if (parts[i].includes("3YEAR")) {
      year = "3 YEAR";
      break;
    }
  }
  if (kavachType && year) {
    return `${kavachType} ${year}`;
  }
  return null;
}

module.exports = extractKeyType;
