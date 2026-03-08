// Standardized API response format
// { success, message, data }

export const sendSuccess = (res, message = "Success", data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res, message = "Something went wrong", statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

// Shortcuts
export const ok        = (res, data, message = "Success")           => sendSuccess(res, message, data, 200);
export const created   = (res, data, message = "Created successfully") => sendSuccess(res, message, data, 201);
export const badReq    = (res, message = "Bad request")             => sendError(res, message, 400);
export const unauth    = (res, message = "Authentication required") => sendError(res, message, 401);
export const forbidden = (res, message = "Access denied")           => sendError(res, message, 403);
export const notFound  = (res, message = "Resource not found")      => sendError(res, message, 404);
export const conflict  = (res, message = "Record already exists")   => sendError(res, message, 409);
export const serverErr = (res, message = "Internal server error")   => sendError(res, message, 500);