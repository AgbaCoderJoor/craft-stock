import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  loginUser,
  registerUser,
  listUsers,
  deleteUser,
  changeUserPassword,
  getCurrentUser,
  logoutUser,
  signupBusiness,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from "./auth.service";
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
    const user = await registerUser(data, req.user!.business_id);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    res.json(await listUsers(req.user!.business_id));
  } catch (err) {
    next(err);
  }
};

export const removeUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await deleteUser(Number(req.params.id), req.user!.business_id, req.user!.user_id);
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
    await changeUserPassword(Number(req.params.id), password, req.user!.business_id, req.user!.user_id);
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
    await logoutUser(req.user!.user_id, req.user!.business_id);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
};

const SignupSchema = z.object({
  business_name: z.string().min(2, "Business name must be at least 2 characters"),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const TokenSchema = z.object({
  token: z.string().min(1),
});

const EmailSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = SignupSchema.parse(req.body);
    res.status(201).json(await signupBusiness(data));
  } catch (err) {
    next(err);
  }
};

export const verify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = TokenSchema.parse(req.body);
    res.json(await verifyEmail(token));
  } catch (err) {
    next(err);
  }
};

export const resend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = EmailSchema.parse(req.body);
    res.json(await resendVerification(email));
  } catch (err) {
    next(err);
  }
};

export const forgot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = EmailSchema.parse(req.body);
    res.json(await forgotPassword(email));
  } catch (err) {
    next(err);
  }
};

export const reset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, password } = ResetPasswordSchema.parse(req.body);
    res.json(await resetPassword(token, password));
  } catch (err) {
    next(err);
  }
};
