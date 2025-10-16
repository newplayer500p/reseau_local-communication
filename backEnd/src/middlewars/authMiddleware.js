import { getEmailFromAccessToken } from "../utils/helperToken.js";

export default function authMiddleWare(req, res, next){
    const authHeader = req.headers.authorization;
    const token = getEmailFromAccessToken(authHeader);

    if (!token) return res.sendStatus(401);

    req.email = token;
    next();
}