"use server";

import { z } from "zod";

import { defineAction } from "@/server/core/action";
import { enforceRateLimit } from "@/server/core/rate-limit";
import { alertRecipientSchema, contactMessageSchema } from "./schemas";
import { addAlertRecipient, removeAlertRecipient } from "./server/alerts";
import { messagesService } from "./server/service";

/** The public contact form. */
export const sendContactMessageAction = defineAction({
  public: true,
  input: contactMessageSchema,
  handler: async ({ website, ...message }) => {
    // Bots fill the hidden field: pretend it worked, store nothing.
    if (website) return;
    await enforceRateLimit("contact");
    await messagesService.create(message);
  },
});

const idInput = z.object({ id: z.uuid() });

export const setMessageReadAction = defineAction({
  permissions: ["messages.view"],
  input: idInput.extend({ read: z.boolean() }),
  handler: ({ id, read }) => messagesService.setRead(id, read),
  refresh: true,
});

export const deleteMessageAction = defineAction({
  permissions: ["messages.view"],
  input: idInput,
  handler: ({ id }) => messagesService.remove(id),
  refresh: true,
});

export const addAlertRecipientAction = defineAction({
  permissions: ["messages.view"],
  input: alertRecipientSchema,
  handler: ({ email }, { user }) => addAlertRecipient(email, user.id),
  refresh: true,
});

export const removeAlertRecipientAction = defineAction({
  permissions: ["messages.view"],
  input: alertRecipientSchema,
  handler: ({ email }, { user }) => removeAlertRecipient(email, user.id),
  refresh: true,
});
