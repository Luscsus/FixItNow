import { useState } from "react";
import { useAuth } from "@/context/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { UserHero } from "@/components/user-account/UserHero";
import { NotificationsCard } from "@/components/user-account/NotificationsCard";
import { OverviewTab } from "@/components/user-account/OverviewTab";
import { TicketsTab } from "@/components/user-account/TicketsTab";
import { SavedProvidersTab } from "@/components/user-account/SavedProvidersTab";
import { BillingTab } from "@/components/user-account/BillingTab";

const TABS = ["Overview", "Tickets", "Saved providers", "Billing"] as const;
type Tab = (typeof TABS)[number];

export function UserAccountPage() {
  const { userInfo, clearSession } = useAuth();
  const { data: profile } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  const firstName        = profile?.firstName ?? userInfo.firstName;
  const lastName         = profile?.lastName  ?? userInfo.lastName;
  const email            = profile?.email     ?? userInfo.email;
  const fullName         = [firstName, lastName].filter(Boolean).join(" ") || "Account";
  const initials         = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || userInfo.initials || "?";
  const profilePictureUrl = profile?.profilePictureUrl ?? null;

  return (
    <div>
      <UserHero fullName={fullName} initials={initials} email={email} profilePictureUrl={profilePictureUrl} />

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

          {activeTab === "Overview" && (
            <OverviewTab firstName={firstName} lastName={lastName} email={email} />
          )}
          {activeTab === "Tickets" && <TicketsTab />}
          {activeTab === "Saved providers" && <SavedProvidersTab />}
          {activeTab === "Billing" && <BillingTab />}
        </div>

        <aside>
          <NotificationsCard />

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
