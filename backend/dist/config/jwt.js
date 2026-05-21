import jwt from 'jsonwebtoken';
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be defined in the environment variables');
}
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '24h');
export const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
};
//# sourceMappingURL=jwt.js.map