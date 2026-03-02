import { z } from "zod";

export const inviteCodeSchema = z.object({
  code: z.string().min(1, "Invite code is required"),
});

export type InviteCodeFormData = z.infer<typeof inviteCodeSchema>;

export const createDropSchema = z.object({
  ttlSeconds: z.number().min(1),
  password: z.string().optional(),
  deleteAfterDownloads: z.number().min(0).max(5),
});

export type CreateDropFormData = z.infer<typeof createDropSchema>;

export const passwordSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export type PasswordFormData = z.infer<typeof passwordSchema>;

export const createInviteCodeSchema = z.object({
  label: z.string().min(1, "Label is required").max(100),
  maxTotalBytes: z.number().optional(),
});

export type CreateInviteCodeFormData = z.infer<typeof createInviteCodeSchema>;
