import ApiError from "../utils/ApiError.js";

// Runs when no route matched the request
const notFound = (req, res, next) => {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

export default notFound;
