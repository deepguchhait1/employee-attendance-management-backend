import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

// Upload Image
export const uploadImage = (buffer, folder = "employee-attendance") => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

// Delete Image
export const deleteImage = async (publicId) => {
  if (!publicId) return;

  await cloudinary.uploader.destroy(publicId);
};