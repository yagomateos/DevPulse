import { z } from 'zod';
import { ROLES } from '@/types/domain';

export const inviteMemberSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(64),
  email: z.email('Enter a valid work email'),
  role: z.enum(ROLES),
  message: z.string().trim().max(280, 'Keep the message under 280 characters').optional(),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;

export const changeRoleSchema = z.object({ role: z.enum(ROLES) });
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
