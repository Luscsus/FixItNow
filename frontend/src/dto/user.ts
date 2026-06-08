export type SavedLocationDto = {
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export type UserResponseDto = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  profilePictureUrl?: string | null;
  phoneNumber?: string | null;
  createdAt: string;
  notificationPreferences?: Record<string, boolean> | null;
  location?: SavedLocationDto | null;
};
