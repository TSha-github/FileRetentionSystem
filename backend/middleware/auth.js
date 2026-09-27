const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { AppError } = require("../utils/core");

async function authenticateToken(req, res, next) {
  const header = req.get("authorization") || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return next(new AppError(401, "Authentication required", "AUTHENTICATION_REQUIRED"));

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const rows = await db.query(
      `SELECT u.user_id, u.username, u.role_id, u.customer_id, u.status,
              r.role_name, c.customer_name
       FROM USERS u
       JOIN ROLES r ON r.role_id = u.role_id
       LEFT JOIN CUSTOMER_MASTER c ON c.customer_id = u.customer_id
       WHERE u.user_id = ?`,
      [payload.user_id]
    );

    if (!rows.length) throw new AppError(401, "User account no longer exists", "INVALID_USER");
    const user = rows[0];
    if (!user.status) throw new AppError(403, "User account is disabled", "USER_DISABLED");
    if (user.role_name === "Customer User" && !user.customer_id) throw new AppError(403, "Customer setup is not complete. Contact the administrator.", "CUSTOMER_ASSIGNMENT_REQUIRED");
    if (user.role_name === "Admin" && user.customer_id !== null) throw new AppError(403, "Admin customer assignment is invalid", "INVALID_ADMIN_ASSIGNMENT");
    if (!["Admin", "Customer User"].includes(user.role_name)) throw new AppError(403, "User role is not allowed", "INVALID_ROLE");

    req.user = {
      user_id: user.user_id,
      username: user.username,
      role_id: user.role_id,
      role: user.role_name,
      customer_id: user.customer_id,
      customer_name: user.customer_name || null
    };
    return next();
  } catch (error) {
    if (error instanceof AppError) return next(error);
    return next(new AppError(401, "Invalid or expired token", "INVALID_TOKEN"));
  }
}

function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(new AppError(401, "Authentication required", "AUTHENTICATION_REQUIRED"));
    if (!allowedRoles.includes(req.user.role)) return next(new AppError(403, "Access denied. Insufficient permissions.", "FORBIDDEN"));
    return next();
  };
}

const isAdmin = (user) => user?.role === "Admin";
const customerScope = (user, requestedCustomerId = null) => {
  if (isAdmin(user)) return requestedCustomerId === undefined ? null : requestedCustomerId;
  return user.customer_id;
};

module.exports = { authenticateToken, authorizeRoles, isAdmin, customerScope };
