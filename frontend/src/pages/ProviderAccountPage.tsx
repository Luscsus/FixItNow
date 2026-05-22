import { useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { useCurrentProvider } from "@/hooks/useCurrentProvider";
import { useProviderByIdQuery } from "@/hooks/useProviderByIdQuery";
import type { ProviderDto } from "@/services/providerService";
import { VisitorProfile } from "@/components/provider-account/VisitorProfile";
import { ProviderHero } from "@/components/provider-account/ProviderHero";
import { ActiveJobCard } from "@/components/provider-account/ActiveJobCard";
import { InboundRequests } from "@/components/provider-account/InboundRequests";
import { WeekSchedule } from "@/components/provider-account/WeekSchedule";
import { CredentialsDocuments } from "@/components/provider-account/CredentialsDocuments";
import { SpecialtiesRatesCard } from "@/components/provider-account/SpecialtiesRatesCard";
import { PayoutsCard } from "@/components/provider-account/PayoutsCard";
import { ProfileCompletionCard } from "@/components/provider-account/ProfileCompletionCard";
import { SupportCard } from "@/components/provider-account/SupportCard";

const TABS = ["Today", "Schedule", "Jobs", "Reviews", "Earnings", "Documents", "Profile"] as const;
type Tab = (typeof TABS)[number];

export function ProviderAccountPage() {
  const { id: urlId } = useParams<{ id?: string }>();
  const location = useLocation();
  const { userInfo, clearSession } = useAuth();
  const { data: ownProfile } = useCurrentProvider();
  const [activeTab, setActiveTab] = useState<Tab>("Today");
  const [online, setOnline] = useState(true);

  const stateProvider = (location.state as { provider?: ProviderDto } | null)?.provider;
  const { data: fetchedProvider } = useProviderByIdQuery(
    urlId && !stateProvider ? urlId : "",
  );

  const isOwner = !urlId || ownProfile?.id === urlId;

  if (urlId && !isOwner) {
    return <VisitorProfile provider={stateProvider ?? fetchedProvider} />;
  }

  const firstName = ownProfile?.firstName ?? userInfo.firstName;
  const lastName  = ownProfile?.lastName  ?? userInfo.lastName;
  const email     = ownProfile?.email     ?? userInfo.email;
  const fullName  = [firstName, lastName].filter(Boolean).join(" ") || "Provider";
  const initials  = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || userInfo.initials || "?";

  return (
    <div>
      <ProviderHero
        fullName={fullName}
        initials={initials}
        email={email}
        online={online}
        setOnline={setOnline}
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
                {tab === "Jobs" && <span className="count">187</span>}
                {tab === "Reviews" && <span className="count">142</span>}
              </button>
            ))}
          </div>

          <ActiveJobCard />
          <InboundRequests />
          <WeekSchedule />
          <CredentialsDocuments />
        </div>

        <aside>
          <SpecialtiesRatesCard />
          <PayoutsCard />
          <ProfileCompletionCard />
          <SupportCard />

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
