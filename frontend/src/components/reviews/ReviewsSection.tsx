import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useTicketsQuery } from "@/hooks/useTicketsQuery";
import {
  deleteOwnReview,
  getProviderRatingStats,
  listProviderReviews,
} from "@/services/reviewService";
import { StarRating } from "./StarRating";
import { ReviewForm } from "./ReviewForm";
import { Pagination, usePaginatedItems } from "@/components/ui/Pagination";
import type { Review } from "@/domain/review";

const REVIEWS_PAGE_SIZE = 5;

interface Props {
  providerId: string;
  sectionNumber?: string;
}

function formatReviewDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function getInitials(name: string): string {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}

interface ReviewCardProps {
  review: Review;
  isMine: boolean;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}

function ReviewCard({ review, isMine, onEdit, onDelete, isDeleting }: Readonly<ReviewCardProps>) {
  const { t } = useTranslation();
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: 16,
        background: "var(--card)",
        display: "flex",
        gap: 14,
      }}
    >
      <div
        style={{
          width: 36, height: 36, flexShrink: 0, borderRadius: "50%",
          background: "var(--navy-900)", color: "var(--amber-500)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, letterSpacing: "0.05em", overflow: "hidden",
        }}
      >
        {review.reviewerProfilePictureUrl ? (
          <img
            src={review.reviewerProfilePictureUrl}
            alt={review.reviewerName}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          getInitials(review.reviewerName)
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{review.reviewerName}</span>
          {isMine && (
            <span
              className="mono"
              style={{
                fontSize: 9, padding: "1px 6px", borderRadius: 4,
                background: "var(--amber-100, #fef3c7)", color: "var(--amber-800, #92400e)",
                letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700,
              }}
            >
              {t("reviews.you")}
            </span>
          )}
          <span style={{ flex: 1 }} />
          <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {formatReviewDate(review.createdAt)}
          </span>
        </div>
        <div style={{ marginTop: 4 }}>
          <StarRating value={review.rating} size={14} />
        </div>
        {review.comment && (
          <p style={{ margin: "8px 0 0", fontSize: 14, lineHeight: 1.55, color: "var(--text)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {review.comment}
          </p>
        )}
        {isMine && (
          <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onEdit} disabled={isDeleting}>
              {t("reviews.edit")}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onDelete}
              disabled={isDeleting}
              style={{ color: "#B91C1C" }}
            >
              {isDeleting ? t("reviews.deleting") : t("reviews.delete")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ReviewsSection({ providerId, sectionNumber = "03" }: Readonly<Props>) {
  const { t } = useTranslation();
  const { accessToken, role } = useAuth();
  const currentUser = useCurrentUser();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const reviewsQuery = useQuery({
    queryKey: ["providerReviews", providerId],
    queryFn: () => listProviderReviews(providerId),
    placeholderData: keepPreviousData,
  });

  const statsQuery = useQuery({
    queryKey: ["providerReviewStats", providerId],
    queryFn: () => getProviderRatingStats(providerId),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => deleteOwnReview(providerId, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providerReviews", providerId] });
      queryClient.invalidateQueries({ queryKey: ["providerReviewStats", providerId] });
    },
  });

  const isCustomer = role === "CUSTOMER";
  const myUserId = currentUser.data?.id ?? null;
  const myReview = useMemo<Review | null>(() => {
    if (!myUserId || !reviewsQuery.data) return null;
    return reviewsQuery.data.find((r) => r.reviewerId === myUserId) ?? null;
  }, [reviewsQuery.data, myUserId]);

  const ticketsQuery = useTicketsQuery();
  const canReview = useMemo(() => {
    if (!isCustomer) return false;
    const tickets = ticketsQuery.data ?? [];
    return tickets.some(
      (tk) => tk.assignedServiceProviderId === providerId && tk.status === "COMPLETED",
    );
  }, [isCustomer, ticketsQuery.data, providerId]);

  const reviews = reviewsQuery.data ?? [];
  const avg = statsQuery.data?.averageRating ?? null;
  const count = statsQuery.data?.reviewCount ?? 0;
  const [page, setPage] = useState(1);
  const { pageItems, totalPages, safePage } = usePaginatedItems(reviews, page, REVIEWS_PAGE_SIZE);

  return (
    <>
      <div className="panel-title">
        <span className="num">{sectionNumber}</span>
        <span className="label">{t("reviews.title")}</span>
        <span className="rule" />
      </div>

      <div className="card card-pad" style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex", alignItems: "center", gap: 16,
            paddingBottom: 16, borderBottom: "1px solid var(--border)", marginBottom: 16,
          }}
        >
          <div>
            <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1 }}>
              {avg != null ? avg.toFixed(1) : "—"}
            </div>
            <div style={{ marginTop: 6 }}>
              <StarRating value={avg ?? 0} size={16} />
            </div>
          </div>
          <div style={{ borderLeft: "1px solid var(--border)", paddingLeft: 16 }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {t("reviews.totalReviews")}
            </div>
            <div style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>{count}</div>
          </div>
          <span style={{ flex: 1 }} />
          {isCustomer && !showForm && (myReview || canReview) && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
              {myReview ? t("reviews.editReview") : t("reviews.writeReview")}
            </button>
          )}
        </div>

        {isCustomer && !myReview && !canReview && (
          <div
            style={{
              marginBottom: 16, padding: "10px 14px", borderRadius: 10,
              background: "var(--slate-50, #f8fafc)", border: "1px solid var(--border)",
              fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5,
            }}
          >
            <strong style={{ color: "var(--text)" }}>{t("reviews.workedWith")}</strong>{" "}
            {t("reviews.reviewsOpen")}{" "}
            <strong>{t("reviews.completed")}</strong>.
          </div>
        )}

        {isCustomer && showForm && (
          <div
            style={{
              padding: 16, borderRadius: 10,
              background: "var(--slate-50, #f8fafc)", border: "1px solid var(--border)", marginBottom: 16,
            }}
          >
            <ReviewForm providerId={providerId} existing={myReview} onDone={() => setShowForm(false)} />
          </div>
        )}

        {reviewsQuery.data === undefined && reviewsQuery.isPending && (
          <div style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: 16 }}>
            {t("reviews.loading")}
          </div>
        )}

        {reviewsQuery.data !== undefined && reviews.length === 0 && (
          <div style={{ color: "var(--text-muted)", fontSize: 14, textAlign: "center", padding: "24px 16px", fontStyle: "italic" }}>
            {t("reviews.empty")}
          </div>
        )}

        {reviews.length > 0 && (
          <>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pageItems.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  isMine={r.reviewerId === myUserId}
                  onEdit={() => setShowForm(true)}
                  onDelete={() => {
                    if (window.confirm(t("reviews.deleteConfirm"))) deleteMutation.mutate();
                  }}
                  isDeleting={deleteMutation.isPending}
                />
              ))}
            </div>
            <Pagination page={safePage} total={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </>
  );
}
