const fetch = require("node-fetch");
const { gstInApiKey } = require("../config");

module.exports = async (number) => {
  return new Promise(async (resolve, reject) => {
    try {
      const url = `https://sheet.gstincheck.co.in/check/${gstInApiKey}/${number}`;
      const response = await fetch(url);
      const data = await response.json();
      resolve(data);
    } catch (error) {
      reject(error);
    }
  });
};
