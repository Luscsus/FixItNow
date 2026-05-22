import { useState } from "react";
import { useAuth } from "@/context/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { UserHero } from "@/components/user-account/UserHero";
import { PersonalInfoCard } from "@/components/user-account/PersonalInfoCard";
import { RecentTicketsCard } from "@/components/user-account/RecentTicketsCard";
import { BuildingsLocationsCard } from "@/components/user-account/BuildingsLocationsCard";
import { NotificationsCard } from "@/components/user-account/NotificationsCard";
import { SecurityCard } from "@/components/user-account/SecurityCard";

const TABS = ["Overview", "Tickets", "Saved providers", "Buildings", "Billing", "Settings"] as const;
type Tab = (typeof TABS)[number];

export function UserAccountPage() {
  const { userInfo, clearSession } = useAuth();
  const { data: profile } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  const firstName = profile?.firstName ?? userInfo.firstName;
  const lastName  = profile?.lastName  ?? userInfo.lastName;
  const email     = profile?.email     ?? userInfo.email;
  const fullName  = [firstName, lastName].filter(Boolean).join(" ") || "Account";
  const initials  = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || userInfo.initials || "?";

  return (
    <div>
      <UserHero fullName={fullName} initials={initials} email={email} />

      <main className="container acct-body">
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

          <PersonalInfoCard firstName={firstName} lastName={lastName} email={email} />
          <RecentTicketsCard />
          <BuildingsLocationsCard />
        </div>

        <aside>
          <NotificationsCard />
          <SecurityCard email={email} />

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
