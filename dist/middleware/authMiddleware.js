import jwt, { decode } from "jsonwebtoken";
export const authMiddleware = async (req, res, next) => {
    try {
        const authHader = req.headers.authorization;
        if (!authHader?.startsWith("Bearer ") || !authHader) {
            return res.status(401).json({
                message: "unauthorized! header missing"
            });
        }
        const token = authHader.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                message: "unauthorized! token missing"
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_TOKEN);
        if (!decoded) {
            return res.status(401).json({
                message: "unauthorized! token mismatched"
            });
        }
        req.id = decoded.id;
        req.roleId = decoded.roleId;
        next();
    }
    catch (err) {
        return res.status(500).json({
            message: "Internal server error",
            error: err instanceof Error ? err.message : undefined
        });
    }
};
//# sourceMappingURL=authMiddleware.js.map