import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
  for (let i = 0; i < id.length; i++) hash = id.codePointAt(i)! + ((hash << 5) - hash);
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

function StatusBadge({ status }: { readonly status: string }) {
  const s = STATUS_STYLES[status] ?? { bg: "var(--slate-50, #F8FAFC)", color: "var(--text-muted)" };
  return (
    <span style={{
      background: s.bg, color: s.color,
      fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700,
      padding: "3px 8px", borderRadius: 5, letterSpacing: "0.04em",
      textTransform: "uppercase",
    }}>
      {status.replaceAll("_", " ")}
    </span>
  );
}

export function AdminUsersPage() {
  const { t } = useTranslation();
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
        onError: () => notify(t("admin.failedRole"), "error"),
      },
    );
  }

  function handleSuspend(user: AdminUser) {
    suspend.mutate(user.id, {
      onSuccess: (msg) => notify(msg.text, "success"),
      onError: () => notify(t("admin.failedSuspend"), "error"),
    });
  }

  function handleReactivate(user: AdminUser) {
    reactivate.mutate(user.id, {
      onSuccess: (msg) => notify(msg.text, "success"),
      onError: () => notify(t("admin.failedReactivate"), "error"),
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
      onError: () => notify(t("admin.failedDelete"), "error"),
    });
  }

  const busy = changeRole.isPending || suspend.isPending || reactivate.isPending || remove.isPending;

  return (
    <section className="admin-page" style={{ flex: 1, overflowY: "auto", padding: "28px 32px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <span className="eyebrow">Console · {t("admin.userMgmt")}</span>
            <h1 style={{ fontSize: "clamp(22px, 2.4vw, 30px)", fontWeight: 700, letterSpacing: "-0.025em", margin: "6px 0 0" }}>
              {t("admin.allUsers")} <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>· {users.length}</span>
            </h1>
          </div>
          <span style={{ flex: 1 }} />
          <SearchField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("admin.searchUsers")}
            containerStyle={{ maxWidth: 320, minWidth: 220 }}
          />
        </div>

        {isLoading && <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>{t("admin.loadingUsers")}</div>}
        {error && <div style={{ padding: 40, textAlign: "center", color: "var(--red-600)" }}>{t("admin.failedUsers")}</div>}

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
              <div>{t("admin.colUser")}</div>
              <div>{t("admin.colEmail")}</div>
              <div>{t("admin.colRole")}</div>
              <div>{t("admin.colStatus")}</div>
              <div style={{ textAlign: "right" }}>{t("admin.colActions")}</div>
            </div>

            {filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>{t("admin.noUsersMatch")}</div>
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

                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {u.email}
                  </div>

                  <div>
                    {isProvider ? (
                      <span style={{
                        background: "var(--navy-50, #EEF2FB)", color: "var(--navy-700, #142C5E)",
                        fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700,
                        padding: "5px 10px", borderRadius: 6, letterSpacing: "0.06em",
                      }} title={t("admin.providerLocked")}>
                        PROVIDER 🔒
                      </span>
                    ) : (
                      <StyledSelect
                        value={u.role}
                        disabled={busy || isDeleted}
                        onChange={(e) => handleRoleChange(u, e.target.value)}
                      >
                        <option value="CUSTOMER">{t("admin.roleCustomer")}</option>
                        <option value="ADMIN">{t("admin.roleAdmin")}</option>
                      </StyledSelect>
                    )}
                  </div>

                  <div><StatusBadge status={u.status} /></div>

                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                    {u.status === "SUSPENDED" ? (
                      <button className="btn btn-sm btn-secondary" disabled={busy} onClick={() => handleReactivate(u)}>
                        {t("admin.reactivate")}
                      </button>
                    ) : (
                      <button
                        className="btn btn-sm btn-secondary"
                        disabled={busy || isDeleted}
                        onClick={() => handleSuspend(u)}
                      >
                        {t("admin.suspend")}
                      </button>
                    )}
                    <button
                      className="btn btn-sm"
                      disabled={busy || isDeleted}
                      onClick={() => setConfirmDelete(u)}
                      style={{ background: "var(--red-100)", color: "var(--red-700)", border: "1px solid #FCA5A5" }}
                    >
                      {t("common.delete")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p style={{ marginTop: 14, fontSize: 12.5, color: "var(--text-muted)" }}>
          {t("admin.roleChangeNote")}
        </p>
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title={t("admin.deleteUser_title")}
        confirmLabel={t("admin.deleteUser_label")}
        loadingLabel={t("admin.deleteUser_loading")}
        loading={remove.isPending}
        onConfirm={confirmDeleteUser}
        onCancel={() => setConfirmDelete(null)}
      >
        {confirmDelete && (
          <>
            {t("admin.deleteUser_about")}{" "}
            <strong style={{ color: "var(--text)" }}>{confirmDelete.firstName} {confirmDelete.lastName}</strong>{" "}
            (<span style={{ fontFamily: "var(--font-mono)", fontSize: 13 }}>{confirmDelete.email}</span>).{" "}
            {t("admin.deleteUser_body")}
          </>
        )}
      </ConfirmDialog>
    </section>
  );
}
