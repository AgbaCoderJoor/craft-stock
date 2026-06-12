import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { user_id: number; role: string; email: string; business_id: number };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthRequest["user"];
    // Tokens issued before the multi-tenant migration lack business_id
    if (typeof decoded?.business_id !== "number") {
      res.status(401).json({ message: "Session expired — please log in again" });
      return;
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
