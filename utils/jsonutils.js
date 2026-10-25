import jwt from "jsonwebtoken"
import secretKey from "../jwtConfig.js"

const generateToken = (user) => {
    const payload = {
        id: user._id,
        name: user.name || 'User',
        email: user.email || (user.phone ? `${user.phone}@mobile.local` : 'user@growthpilot.local'),
        phone: user.phone || null,
        avatar: user.avatar || null
    }
    return jwt.sign(payload, secretKey, { expiresIn: '24h' })
}
export default generateToken