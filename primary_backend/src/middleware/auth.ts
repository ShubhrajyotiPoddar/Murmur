import jwt from "jsonwebtoken";
import { NextFunction } from "express";
import dotenv from "dotenv";

const secretKey = process.env.SECRET_KEY as string;

const authMiddleware = (req: any, res: any, next: NextFunction) => {
  // Use includes or endsWith so it works whether used locally or globally in index.ts
  if (req.path.endsWith("/login") || req.path.endsWith("/register")) {
    return next(); // Use return here!
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No Token provided" });
  }

  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid Token" });
  }
};

export default authMiddleware;
