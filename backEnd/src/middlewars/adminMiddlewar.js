// middlewares/checkAdmin.js
import { getEmailFromAccessToken } from "../utils/helperToken.js";
import * as userService from "../service/user.service.js";

export const checkAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    if (!token) {
      return res.sendStatus(401);
    }

    const email = getEmailFromAccessToken(token);

    const user = await userService.getUserByEmail(email);

    if (user && user.status === "Admin") {
      next();
    } else {
      res.sendStatus(403);
    }
  } catch (err) {
    next(err);
  }
};