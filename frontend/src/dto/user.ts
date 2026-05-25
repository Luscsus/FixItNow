export type UserResponseDto = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  createdAt: string;
  notificationPreferences?: Record<string, boolean> | null;
};
