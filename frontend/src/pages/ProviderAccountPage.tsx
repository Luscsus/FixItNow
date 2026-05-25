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

  return (
    <div>
      <ProviderHero
        fullName={fullName}
        initials={initials}
        email={email}
        online={online}
        setOnline={setOnline}
        stats={stats}
      />

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
            <div className="card" style={{ padding: "24px", color: "var(--text-muted)", fontSize: 14 }}>
              Reviews coming soon.
            </div>
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
