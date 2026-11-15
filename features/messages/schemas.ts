import { z } from "zod";

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(120),
  email: z.email("Enter a valid email address").max(200),
  phone: z.string().trim().max(40),
  message: z.string().trim().min(5, "Write a short message").max(5000),
  /** Honeypot: hidden from people, filled in by bots. */
  website: z.string().max(200).optional(),
});
export type ContactMessageInput = z.input<typeof contactMessageSchema>;

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  readAt: string | null;
  createdAt: string;
};
