import { useMemo, useState } from "react";
import {
  useAdminUsers,
  useChangeUserRoleMutation,
  useDeleteUserMutation,
  useReactivateUserMutation,
  useSuspendUserMutation,
} from "@/hooks/useAdminUsers";
import { useToast } from "@/components/ui/toast";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { SearchField } from "@/components/ui/SearchField";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { AdminUser } from "@/domain/admin";

const AVATAR_COLORS = [
  "#142C5E", "#047857", "#B45309", "#2563EB",
  "#7C3AED", "#DC2626", "#0891B2", "#65A30D",
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initials(u: AdminUser) {
  return `${u.firstName?.[0] ?? ""}${u.lastName?.[0] ?? ""}`.toUpperCase() || u.email[0].toUpperCase();
}

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: "var(--emerald-50, #ECFDF5)", color: "var(--emerald-600, #059669)" },
  SUSPENDED: { bg: "var(--amber-100, #FEF3C7)", color: "var(--amber-700, #B45309)" },
  DELETED: { bg: "var(--red-100, #FEE2E2)", color: "var(--red-700, #B91C1C)" },
  REJECTED: { bg: "var(--red-100, #FEE2E2)", color: "var(--red-700, #B91C1C)" },
  PENDING_APPROVAL: { bg: "var(--navy-50, #EEF2FB)", color: "var(--navy-700, #142C5E)" },
  PENDING_VERIFICATION: { bg: "var(--navy-50, #EEF2FB)", color: "var(--navy-700, #142C5E)" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: "var(--slate-50, #F8FAFC)", color: "var(--text-muted)" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700,
      padding: "3px 8px", borderRadius: 5, letterSpacing: "0.04em",
      textTransform: "uppercase",
    }}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function AdminUsersPage() {
  const { data: users = [], isLoading, error } = useAdminUsers();
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<AdminUser | null>(null);

  const changeRole = useChangeUserRoleMutation();
  const suspend = useSuspendUserMutation();
  const reactivate = useReactivateUserMutation();
  const remove = useDeleteUserMutation();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      `${u.firstName} ${u.lastName} ${u.email} ${u.role}`.toLowerCase().includes(q),
    );
  }, [users, query]);

  function handleRoleChange(user: AdminUser, role: string) {
    if (role !== "CUSTOMER" && role !== "ADMIN") return;
    changeRole.mutate(
      { id: user.id, role },
      {
        onSuccess: (msg) => notify(msg.text, "success"),
        onError: () => notify("Failed to change role.", "error"),
      },
    );
  }

  function handleSuspend(user: AdminUser) {
    suspend.mutate(user.id, {
      onSuccess: (msg) => notify(msg.text, "success"),
      onError: () => notify("Failed to suspend user.", "error"),
    });
  }

  function handleReactivate(user: AdminUser) {
    reactivate.mutate(user.id, {
      onSuccess: (msg) => notify(msg.text, "success"),
      onError: () => notify("Failed to reactivate user.", "error"),
    });
  }

  function confirmDeleteUser() {
    const user = confirmDelete;
    if (!user) return;
    remove.mutate(user.id, {
      onSuccess: (msg) => {
        notify(msg.text, "success");
        setConfirmDelete(null);
      },
      onError: () => notify("Failed to delete user.", "error"),
    });
  }

  const busy = changeRole.isPending || suspend.isPending || reactivate.isPending || remove.isPending;

  return (
    <section className="admin-page" style={{ flex: 1, overflowY: "auto", padding: "28px 32px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <span className="eyebrow">Console · User management</span>
            <h1 style={{ fontSize: "clamp(22px, 2.4vw, 30px)", fontWeight: 700, letterSpacing: "-0.025em", margin: "6px 0 0" }}>
              All users <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>· {users.length}</span>
            </h1>
          </div>
          <span style={{ flex: 1 }} />
          <SearchField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, role…"
            containerStyle={{ maxWidth: 320, minWidth: 220 }}
          />
        </div>

        {isLoading && <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading users…</div>}
        {error && <div style={{ padding: 40, textAlign: "center", color: "var(--red-600)" }}>Failed to load users.</div>}

        {!isLoading && !error && (
          <div className="admin-table" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
            <div className="admin-table-head" style={{
              display: "grid",
              gridTemplateColumns: "minmax(220px, 2fr) 1.4fr 150px 130px 1fr",
              gap: 12,
              padding: "12px 18px",
              borderBottom: "1px solid var(--border)",
              fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700,
              color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              <div>User</div>
              <div>Email</div>
              <div>Role</div>
              <div>Status</div>
              <div style={{ textAlign: "right" }}>Actions</div>
            </div>

            {filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>No users match your search.</div>
            )}

            {filtered.map((u) => {
              const isProvider = u.role === "PROVIDER";
              const isDeleted = u.status === "DELETED";
              return (
                <div key={u.id} className="admin-table-row" style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(220px, 2fr) 1.4fr 150px 130px 1fr",
                  gap: 12,
                  padding: "14px 18px",
                  borderBottom: "1px solid var(--border)",
                  alignItems: "center",
                  opacity: isDeleted ? 0.55 : 1,
                }}>
                  {/* User */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: avatarColor(u.id), color: "#fff",
                      fontSize: 12, fontWeight: 600,
                      display: "grid", placeItems: "center", flexShrink: 0, overflow: "hidden",
                    }}>
                      {u.profilePictureUrl
                        ? <img src={u.profilePictureUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : initials(u)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {u.firstName} {u.lastName}
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {u.email}
                  </div>

                  {/* Role */}
                  <div>
                    {isProvider ? (
                      <span style={{
                        background: "var(--navy-50, #EEF2FB)", color: "var(--navy-700, #142C5E)",
                        fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700,
                        padding: "5px 10px", borderRadius: 6, letterSpacing: "0.06em",
                      }} title="Provider role changes are managed through provider approvals.">
                        PROVIDER 🔒
                      </span>
                    ) : (
                      <StyledSelect
                        value={u.role}
                        disabled={busy || isDeleted}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                      >
                        <option value="CUSTOMER">Customer</option>
                        <option value="ADMIN">Admin</option>
                      </StyledSelect>
                    )}
                  </div>

                  {/* Status */}
                  <div><StatusBadge status={u.status} /></div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    {u.status === "SUSPENDED" ? (
                      <button className="btn btn-sm btn-secondary" disabled={busy} onClick={() => handleReactivate(u)}>
                        Reactivate
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-secondary"
                        disabled={busy || isDeleted}
                        onClick={() => handleSuspend(u)}
                      >
                        Suspend
                      </button>
                    )}
                    <button
                      className="btn btn-sm"
                      disabled={busy || isDeleted}
                      onClick={() => setConfirmDelete(u)}
                      style={{ background: "var(--red-100)", color: "var(--red-700)", border: "1px solid #FCA5A5" }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p style={{ marginTop: 14, fontSize: 12.5, color: "var(--text-muted)" }}>
          Changing a user's role signs them out of active sessions; they must sign in again for the new role to take effect.
        </p>
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete this user?"
        confirmLabel="Delete user"
        loadingLabel="Deleting…"
        loading={remove.isPending}
        onConfirm={confirmDeleteUser}
        onCancel={() => setConfirmDelete(null)}
      >
        {confirmDelete && (
          <>
            You're about to delete{" "}
            <strong style={{ color: "var(--text)" }}>{confirmDelete.firstName} {confirmDelete.lastName}</strong>{" "}
            (<span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{confirmDelete.email}</span>).
            Their account will be marked as deleted and they'll be signed out immediately. This can't be undone from here.
          </>
        )}
      </ConfirmDialog>
    </section>
  );
}
