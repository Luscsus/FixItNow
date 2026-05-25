export type UserResponseDto = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  profilePictureUrl?: string | null;
  createdAt: string;
  notificationPreferences?: Record<string, boolean> | null;
};
