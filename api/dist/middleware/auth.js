import jwt from 'jsonwebtoken';
export const generateToken = (payload) => {
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const expiresIn = process.env.JWT_EXPIRES_IN;
    let options = undefined;
    if (expiresIn) {
        if (!isNaN(Number(expiresIn))) {
            options = { expiresIn: Number(expiresIn) };
        }
        else {
            options = { expiresIn: expiresIn };
        }
        return jwt.sign(payload, secret, options);
    }
    else {
        return jwt.sign(payload, secret);
    }
};
export const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : req.cookies?.token;
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Token d\'accès requis'
            });
            return;
        }
        const secret = process.env.JWT_SECRET || 'your-secret-key';
        const decoded = jwt.verify(token, secret);
        // Mapper les données JWT vers le format attendu par Express
        req.user = {
            id: decoded.id,
            email: decoded.email,
            first_name: decoded.first_name || '',
            last_name: decoded.last_name || '',
            role: decoded.role || decoded.status_id?.toString(),
            status: decoded.status || decoded.status_id?.toString()
        };
        next();
    }
    catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({
                success: false,
                message: 'Token expiré'
            });
            return;
        }
        res.status(403).json({
            success: false,
            message: 'Token invalide'
        });
        return;
    }
};
export const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : req.cookies?.token;
        if (token) {
            const secret = process.env.JWT_SECRET || 'your-secret-key';
            const decoded = jwt.verify(token, secret);
            // Même mapping pour l'auth optionnelle
            req.user = {
                id: decoded.id,
                email: decoded.email,
                first_name: decoded.first_name || '',
                last_name: decoded.last_name || '',
                role: decoded.role || decoded.status_id?.toString(),
                status: decoded.status || decoded.status_id?.toString()
            };
        }
        next();
    }
    catch (error) {
        next();
    }
};
export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Authentification requise'
            });
            return;
        }
        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Permissions insuffisantes'
            });
            return;
        }
        next();
    };
};
