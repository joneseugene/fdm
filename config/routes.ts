/** Central route map so redirects and links never drift apart. */
export const routes = {
  site: "/",

  // Admin (signed in)
  admin: "/admin",
  content: "/admin/content",
  section: (key: string) => `/admin/content/${key}`,
  messages: "/admin/messages",
  users: "/admin/users",
  settings: "/admin/settings",
  changePassword: "/admin/account/password",
  forbidden: "/admin/forbidden",

  // Public auth pages
  login: "/login",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  /** Accept an invitation: email code, then profile + password. */
  join: "/join",
} as const;

/** Auth pages a signed-in user is sent away from. */
export const GUEST_ONLY_PATHS = [routes.login, routes.forgotPassword] as const;
