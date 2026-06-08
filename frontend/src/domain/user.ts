export type SavedLocation = {
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export type User = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailVerified: boolean;
  profilePictureUrl?: string | null;
  phoneNumber?: string | null;
  createdAt: Date;
  notificationPreferences: Record<string, boolean>;
  /** Saved default location, or null if not set. */
  location: SavedLocation | null;
};
