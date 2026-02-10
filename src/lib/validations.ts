import { z } from 'zod';

export const signUpSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { message: "Full name must be at least 2 characters" })
    .max(50, { message: "Full name must be less than 50 characters" }),
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" })
    .max(128, { message: "Password must be less than 128 characters" })
    .regex(/^(?=.*[a-zA-Z])(?=.*\d)/, {
      message: "Password must contain at least one letter and one number"
    })
});

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Email or username is required" }),
  password: z
    .string()
    .min(1, { message: "Password is required" })
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email({ message: "Please enter a valid email address" })
});

export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;