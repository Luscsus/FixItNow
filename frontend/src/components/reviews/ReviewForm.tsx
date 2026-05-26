import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth";
import { upsertReview } from "@/services/reviewService";
import { StarRating } from "./StarRating";
import type { Review } from "@/domain/review";

interface Props {
  providerId: string;
  existing?: Review | null;
  onDone?: () => void;
}

export function ReviewForm({ providerId, existing, onDone }: Readonly<Props>) {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState<number>(existing?.rating ?? 0);
  const [comment, setComment] = useState<string>(existing?.comment ?? "");
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      if (rating < 1 || rating > 5) throw new Error("Pick a rating from 1 to 5.");
      return upsertReview(providerId, { rating, comment: comment.trim() || null }, accessToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["providerReviews", providerId] });
      queryClient.invalidateQueries({ queryKey: ["providerReviewStats", providerId] });
      onDone?.();
    },
    onError: (err: Error) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          Your rating
        </div>
        <StarRating value={rating} interactive onChange={setRating} size={26} />
      </div>

      <div>
        <label
          htmlFor="review-comment"
          className="mono"
          style={{
            fontSize: 10.5,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            fontWeight: 600,
            marginBottom: 6,
            display: "block",
          }}
        >
          Comment (optional)
        </label>
        <textarea
          id="review-comment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What was good? What could improve?"
          maxLength={2000}
          style={{
            width: "100%",
            boxSizing: "border-box",
            resize: "vertical",
            padding: "10px 12px",
            fontSize: 14,
            lineHeight: 1.5,
            border: "1px solid var(--border)",
            borderRadius: 10,
            background: "var(--slate-50, #f8fafc)",
            color: "var(--text)",
            fontFamily: "inherit",
            outline: "none",
          }}
        />
        <div
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            textAlign: "right",
            marginTop: 2,
          }}
        >
          {comment.length} / 2000
        </div>
      </div>

      {error && (
        <div
          style={{
            fontSize: 12,
            color: "#B91C1C",
            background: "#FEE2E2",
            padding: "6px 10px",
            borderRadius: 6,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        {onDone && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onDone}
            disabled={mutation.isPending}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={mutation.isPending || rating < 1}
        >
          {mutation.isPending
            ? "Saving…"
            : existing
            ? "Update review"
            : "Post review"}
        </button>
      </div>
    </form>
  );
}
