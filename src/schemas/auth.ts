import { z } from 'zod';
import { ROLES } from '@/types/domain';

export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(ROLES),
});

export type LoginInput = z.infer<typeof loginSchema>;
