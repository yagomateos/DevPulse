import * as z from 'zod';
import { ROLES } from '@/types/domain';

export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  /** Honoured only in demo mode; otherwise the member's stored role is used. */
  role: z.enum(ROLES).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** The one password policy: used when accepting an invitation and when changing a password. */
export const newPasswordSchema = z
  .string()
  .min(10, 'Use at least 10 characters')
  .max(128, 'Use at most 128 characters')
  .regex(/[A-Z]/, 'Include an uppercase letter')
  .regex(/[0-9]/, 'Include a number');

export const acceptInvitationSchema = z
  .object({ password: newPasswordSchema, confirmPassword: z.string() })
  .refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
