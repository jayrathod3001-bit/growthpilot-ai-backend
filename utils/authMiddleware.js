import jwt from "jsonwebtoken"
import secretKey from "../jwtConfig.js"

function authanticateToken(req, res, next) {
    const authHeader = req.header('Authorization')
    if (!authHeader) {
        return res.status(401).json({ 'message': "authorization is missing" })
    }

    const [bearer, token] = authHeader.split(" ")

    if (bearer != "Bearer" || !token) {
        return res.status(401).json({ 'message': "invalid token formate" })
    }

    jwt.verify(token, secretKey, (error, user) => {
        if (error) {
            return res.status(403).json({ 'message': "invaid token" })
        }
        req.user = user;
        next()
    })
}

export default authanticateToken 