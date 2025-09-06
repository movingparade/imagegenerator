import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { loginSchema, registerSchema } from "@shared/schema";
import { z } from "zod";

declare module "express-session" {
  interface SessionData {
    userId: string;
    user: {
      id: string;
      email: string;
      name: string | null;
      role: "ADMIN" | "USER";
    };
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: "ADMIN" | "USER";
  };
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ 
        ok: false, 
        error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } 
      });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ 
        ok: false, 
        error: { code: "INVALID_CREDENTIALS", message: "Invalid email or password" } 
      });
    }
    
    // Store user info in session
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    
    res.json({ 
      ok: true, 
      data: { 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      } 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        ok: false, 
        error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.errors } 
      });
    }
    res.status(500).json({ 
      ok: false, 
      error: { code: "INTERNAL_ERROR", message: "Internal server error" } 
    });
  }
}

export async function register(req: Request, res: Response) {
  try {
    const userData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(409).json({ 
        ok: false, 
        error: { code: "USER_EXISTS", message: "User with this email already exists" } 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Create user
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });
    
    // Store user info in session
    req.session.userId = user.id;
    req.session.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    
    res.status(201).json({ 
      ok: true, 
      data: { 
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      } 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        ok: false, 
        error: { code: "VALIDATION_ERROR", message: "Invalid input", details: error.errors } 
      });
    }
    res.status(500).json({ 
      ok: false, 
      error: { code: "INTERNAL_ERROR", message: "Internal server error" } 
    });
  }
}

export async function logout(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ 
        ok: false, 
        error: { code: "LOGOUT_ERROR", message: "Failed to logout" } 
      });
    }
    res.json({ ok: true, data: { message: "Logged out successfully" } });
  });
}

export async function getMe(req: Request, res: Response) {
  if (!req.session.user) {
    return res.status(401).json({ 
      ok: false, 
      error: { code: "UNAUTHORIZED", message: "Not authenticated" } 
    });
  }
  
  res.json({ 
    ok: true, 
    data: { user: req.session.user } 
  });
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user) {
    return res.status(401).json({ 
      ok: false, 
      error: { code: "UNAUTHORIZED", message: "Authentication required" } 
    });
  }
  
  (req as AuthenticatedRequest).user = req.session.user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.user || req.session.user.role !== "ADMIN") {
    return res.status(403).json({ 
      ok: false, 
      error: { code: "FORBIDDEN", message: "Admin access required" } 
    });
  }
  
  (req as AuthenticatedRequest).user = req.session.user;
  next();
}
