import jwt from 'jsonwebtoken';
import secretKey from '../jwtConfig.js';

/**
 * Permissive authentication middleware:
 * Attaches req.user if a valid JWT is provided, but does not block requests if unauthenticated.
 */
export default function optionalAuthMiddleware(req, res, next) {
    const authHeader = req.header('Authorization');
    if (!authHeader) {
        return next();
    }

    const [bearer, token] = authHeader.split(' ');
    if (bearer !== 'Bearer' || !token) {
        return next();
    }

    jwt.verify(token, secretKey, (error, user) => {
        if (!error && user) {
            req.user = user;
        }
        next();
    });
}
