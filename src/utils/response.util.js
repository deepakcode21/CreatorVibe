// Har API response ka ek jaisa format rahega
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
export const ok       = (res, data, message = "Success")           => sendSuccess(res, message, data, 200);
export const created  = (res, data, message = "Created!")          => sendSuccess(res, message, data, 201);
export const badReq   = (res, message = "Bad request")             => sendError(res, message, 400);
export const unauth   = (res, message = "Login karo pehle")        => sendError(res, message, 401);
export const forbidden= (res, message = "Access nahi hai")         => sendError(res, message, 403);
export const notFound = (res, message = "Nahi mila")               => sendError(res, message, 404);
export const conflict = (res, message = "Already exist karta hai") => sendError(res, message, 409);
export const serverErr= (res, message = "Server error")            => sendError(res, message, 500);