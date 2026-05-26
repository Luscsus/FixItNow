export interface Review {
  id: string;
  providerId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerProfilePictureUrl: string | null;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderRatingStats {
  providerId: string;
  /** Mean rating, or null when the provider has no reviews yet. */
  averageRating: number | null;
  reviewCount: number;
}

export interface CreateReviewPayload {
  rating: number;
  comment?: string | null;
}
