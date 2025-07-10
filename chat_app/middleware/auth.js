const jwt = require('jsonwebtoken');

/**
 * Middleware xác thực JWT
 * Hỗ trợ đọc token từ header 'Authorization: Bearer <token>' hoặc 'x-auth-token'
 */
module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const tokenHeader = req.headers['x-auth-token'];
    let token;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7, authHeader.length);
    } else if (tokenHeader) {
        token = tokenHeader;
    }

    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { userId: decoded.userId };
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};