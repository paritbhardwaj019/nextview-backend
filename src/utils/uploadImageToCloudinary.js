const { cloudinaryConfig } = require("../config");

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: cloudinaryConfig.cloudName,
  api_key: cloudinaryConfig.apiKey,
  api_secret: cloudinaryConfig.apiSecret,
  secure: true,
});

module.exports = async (path) => {
  return new Promise(async (resolve, reject) => {
    try {
      const result = await cloudinary.uploader.upload(path);
      resolve(result);
    } catch (error) {
      reject(error);
    }
  });
};
