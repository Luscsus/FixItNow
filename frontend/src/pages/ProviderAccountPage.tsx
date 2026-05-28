import { useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { useCurrentProvider } from "@/hooks/useCurrentProvider";
import { useProviderByIdQuery } from "@/hooks/useProviderByIdQuery";
import { useProviderTicketsQuery } from "@/hooks/useProviderTicketsQuery";
import type { ProviderDto } from "@/services/providerService";
import { VisitorProfile } from "@/components/provider-account/VisitorProfile";
import { ProviderHero } from "@/components/provider-account/ProviderHero";
import { ActiveJobCard } from "@/components/provider-account/ActiveJobCard";
import { InboundRequests } from "@/components/provider-account/InboundRequests";
import { WeekSchedule } from "@/components/provider-account/WeekSchedule";
import { CompletedJobsCard } from "@/components/provider-account/CompletedJobsCard";
import { PayoutsCard } from "@/components/provider-account/PayoutsCard";
import { NotificationsCard } from "@/components/provider-account/NotificationsCard";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { Link } from "react-router-dom";

const TABS = ["Overview", "Schedule", "Jobs", "Reviews"] as const;
type Tab = (typeof TABS)[number];

export function ProviderAccountPage() {
  const { id: urlId } = useParams<{ id?: string }>();
  const location = useLocation();
  const { userInfo, clearSession } = useAuth();
  const { data: ownProfile } = useCurrentProvider();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [online, setOnline] = useState(true);

  const stateProvider = (location.state as { provider?: ProviderDto } | null)?.provider;
  const { data: fetchedProvider } = useProviderByIdQuery(
    urlId && !stateProvider ? urlId : "",
  );
  const { data: providerTickets = [] } = useProviderTicketsQuery();

  const isOwner = !urlId || ownProfile?.id === urlId;

  if (urlId && !isOwner) {
    return <VisitorProfile provider={stateProvider ?? fetchedProvider} />;
  }

  const firstName = ownProfile?.firstName ?? userInfo.firstName;
  const lastName  = ownProfile?.lastName  ?? userInfo.lastName;
  const email     = ownProfile?.email     ?? userInfo.email;
  const fullName  = [firstName, lastName].filter(Boolean).join(" ") || "Provider";
  const initials  = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || userInfo.initials || "?";

  const ACTIVE_STATUSES = ["APPROVED", "IN_TRANSIT", "PENDING_PROVIDER_INVOICE", "PENDING_PAYMENT"];
  const completedTickets = providerTickets.filter((t) => t.status === "COMPLETED");
  const activeTickets    = providerTickets.filter((t) => ACTIVE_STATUSES.includes(t.status));
  const inboundTickets   = providerTickets.filter((t) => t.status === "PENDING_APPROVAL");
  const totalEarned = completedTickets.reduce((sum, t) => sum + (t.estimatedCost ?? 0), 0);
  const stats = {
    completedJobs:    completedTickets.length,
    activeJobs:       activeTickets.length,
    inboundRequests:  inboundTickets.length,
    totalEarned:      completedTickets.some((t) => t.estimatedCost != null) ? totalEarned : null,
  };

  // Provider is missing payout details if any required bank field is empty.
  // Until they fill these in they can't accept work. (BIC/SWIFT was dropped —
  // not needed for SEPA transfers within the EEA.)
  const bankInfoMissing =
    !!ownProfile &&
    (!ownProfile.bankAccountHolder?.trim()
      || !ownProfile.bankIban?.trim()
      || !ownProfile.bankName?.trim());

  return (
    <div>
      <ProviderHero
        fullName={fullName}
        initials={initials}
        profilePictureUrl={ownProfile?.profilePictureUrl}
        email={email}
        online={online}
        setOnline={setOnline}
        stats={stats}
        emailVerified={ownProfile?.emailVerified}
      />

      {bankInfoMissing && (
        <div className="container" style={{ marginTop: 16 }}>
          <div
            role="alert"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 18px",
              borderRadius: 12,
              background: "var(--amber-50, #fffbeb)",
              border: "1px solid var(--amber-300, #fcd34d)",
              color: "var(--amber-900, #78350f)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14 }}>Set your payout details to start accepting jobs</div>
              <div style={{ fontSize: 13, marginTop: 2, lineHeight: 1.45 }}>
                Customers need somewhere to send payment. Add your IBAN, BIC and bank name to your profile.
              </div>
            </div>
            <Link to="/profile/edit" className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
              Add now →
            </Link>
          </div>
        </div>
      )}

      <main className="container pro-body">
        <div>
          <div className="tabs" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "Overview" && (
            <>
              <ActiveJobCard />
              <InboundRequests />
            </>
          )}

          {activeTab === "Schedule" && ownProfile?.id && (
            <WeekSchedule providerId={ownProfile.id} editable />
          )}

          {activeTab === "Jobs" && <CompletedJobsCard />}

          {activeTab === "Reviews" && (
            ownProfile?.id ? (
              <ReviewsSection providerId={ownProfile.id} sectionNumber="01" />
            ) : (
              <div className="card" style={{ padding: "24px", color: "var(--text-muted)", fontSize: 14 }}>
                Loading reviews…
              </div>
            )
          )}
        </div>

        <aside>
          <NotificationsCard />
          <PayoutsCard />

          <button
            className="btn btn-danger btn-full"
            style={{ marginTop: 20 }}
            onClick={clearSession}
          >
            Sign out
          </button>
        </aside>
      </main>
    </div>
  );
}
