import type { UserProfile } from "@/types";

function hashPassword(pw: string): string {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) h = (h * 33) ^ pw.charCodeAt(i);
  return `h${(h >>> 0).toString(36)}`;
}

export const seedUsers: UserProfile[] = [
  {
    id: "u-casey",
    username: "Casey Viewer",
    email: "viewer@lumen.test",
    passwordHash: hashPassword("viewer123"),
    bio: "Just here for the documentaries and the occasional dragon.",
    avatarPalette: 4,
    role: "viewer",
    createdAt: "2024-10-02T09:00:00Z",
  },
  {
    id: "u-dana",
    username: "Dana Fieldcraft",
    email: "creator@lumen.test",
    passwordHash: hashPassword("creator123"),
    bio: "Filmmaker at Nova Fieldcraft. Light, sound, patience.",
    avatarPalette: 0,
    role: "creator",
    createdAt: "2024-10-02T09:00:00Z",
  },
  {
    id: "u-admin",
    username: "Site Administrator",
    email: "admin@lumen.test",
    passwordHash: hashPassword("admin123"),
    bio: "Keeps the lights on.",
    avatarPalette: 7,
    role: "admin",
    createdAt: "2024-10-02T09:00:00Z",
  },
];

export const seedComments = [
  {
    id: "cm-1",
    contentId: "film-sintel",
    userId: "u-casey",
    userName: "Casey Viewer",
    avatarPalette: 4,
    text: "Still stunning after all these years. The snow animation holds up beautifully.",
    createdAt: "2025-05-02T10:00:00Z",
    likes: 41,
  },
  {
    id: "cm-2",
    contentId: "vid-natural-light",
    userId: "u-dana",
    userName: "Dana Fieldcraft",
    avatarPalette: 0,
    text: "Corner rule of thumb: if the light looks good from the corner, it will read well on camera too.",
    createdAt: "2025-06-10T14:20:00Z",
    likes: 12,
  },
  {
    id: "cm-3",
    contentId: "vid-tortilla",
    userId: "u-casey",
    userName: "Casey Viewer",
    avatarPalette: 4,
    text: "Made these on the weekend. Thepier trick with the dry pan is real.",
    createdAt: "2025-08-20T18:05:00Z",
    likes: 7,
  },
];

export { hashPassword };
