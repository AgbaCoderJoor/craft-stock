import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { loginUser, registerUser, listUsers, deleteUser, changeUserPassword, getCurrentUser, logoutUser } from "./auth.service";
import { AuthRequest } from "../../middleware/auth.middleware";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const RegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role_name: z.enum(["admin", "store_manager", "production_staff", "viewer"]),
});

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = LoginSchema.parse(req.body);
    const result = await loginUser(email, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const register = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = RegisterSchema.parse(req.body);
    const user = await registerUser(data);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (_req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await listUsers());
  } catch (err) {
    next(err);
  }
};

export const removeUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await deleteUser(Number(req.params.id), req.user!.user_id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const ChangePasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { password } = ChangePasswordSchema.parse(req.body);
    await changeUserPassword(Number(req.params.id), password, req.user!.user_id);
    res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await getCurrentUser(req.user!.user_id));
  } catch (err) {
    next(err);
  }
};

export const logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await logoutUser(req.user!.user_id);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};
