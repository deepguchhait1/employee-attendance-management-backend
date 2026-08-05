import { sendResponse } from "../utils/response.js";

export const notFound = (req, res) => {
  sendResponse(res, 404, false, "Route Not Found");
};