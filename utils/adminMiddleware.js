import jwt from 'jsonwebtoken'
import secretKey from '../jwtConfig.js'

function adminMiddleware(req, res, next) {
    const authHeader = req.header('Authorization')
    if (!authHeader) {
        return res.status(401).json({ message: 'Authorization missing' })
    }

    const [bearer, token] = authHeader.split(' ')
    if (bearer !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'Invalid token format' })
    }

    jwt.verify(token, secretKey, (error, decoded) => {
        if (error) {
            return res.status(403).json({ message: 'Invalid or expired admin token' })
        }
        if (!decoded.isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admins only.' })
        }
        req.admin = decoded
        next()
    })
}

export default adminMiddleware
