"use server";

import { z } from "zod";

import { defineAction } from "@/server/core/action";
import { inviteUserSchema, updateUserSchema } from "./schemas";
import { usersService } from "./server/service";

const idInput = z.object({ id: z.uuid() });

export const inviteUserAction = defineAction({
  permissions: ["users.manage"],
  input: inviteUserSchema,
  handler: (input) => usersService.invite(input),
  refresh: true,
});

export const updateUserAction = defineAction({
  permissions: ["users.manage"],
  input: updateUserSchema,
  handler: (input, { user }) => usersService.update(user, input),
  refresh: true,
});

export const resendInviteAction = defineAction({
  permissions: ["users.manage"],
  input: idInput,
  handler: ({ id }) => usersService.resendInvite(id),
});

export const setUserBlockedAction = defineAction({
  permissions: ["users.manage"],
  input: idInput.extend({ blocked: z.boolean() }),
  handler: ({ id, blocked }, { user }) => usersService.setBlocked(user, id, blocked),
  refresh: true,
});

export const removeUserAction = defineAction({
  permissions: ["users.manage"],
  input: idInput,
  handler: ({ id }, { user }) => usersService.remove(user, id),
  refresh: true,
});
