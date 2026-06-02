import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { UserHero } from "@/components/user-account/UserHero";
import { NotificationsCard } from "@/components/user-account/NotificationsCard";
import { OverviewTab } from "@/components/user-account/OverviewTab";
import { TicketsTab } from "@/components/user-account/TicketsTab";
import { SavedProvidersTab } from "@/components/user-account/SavedProvidersTab";
import { BillingTab } from "@/components/user-account/BillingTab";

type Tab = "Overview" | "Tickets" | "Saved providers" | "Billing";

export function UserAccountPage() {
  const { t } = useTranslation();
  const { userInfo, clearSession } = useAuth();
  const { data: profile } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  const firstName         = profile?.firstName ?? userInfo.firstName;
  const lastName          = profile?.lastName  ?? userInfo.lastName;
  const email             = profile?.email     ?? userInfo.email;
  const fullName          = [firstName, lastName].filter(Boolean).join(" ") || "Account";
  const initials          = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || userInfo.initials || "?";
  const profilePictureUrl = profile?.profilePictureUrl ?? null;
  const emailVerified     = profile?.emailVerified;

  const TABS: { key: Tab; label: string; short: string }[] = [
    { key: "Overview",         label: t("userAccount.tabOverview"),        short: t("userAccount.tabOverview") },
    { key: "Tickets",          label: t("userAccount.tabTickets"),         short: t("userAccount.tabTickets") },
    { key: "Saved providers",  label: t("userAccount.tabSavedProviders"),  short: t("userAccount.tabSavedShort") },
    { key: "Billing",          label: t("userAccount.tabBilling"),         short: t("userAccount.tabBilling") },
  ];

  return (
    <div>
      <UserHero fullName={fullName} initials={initials} email={email} profilePictureUrl={profilePictureUrl} emailVerified={emailVerified} />

      <main className="container acct-body">
        <div>
          <div className="tabs" role="tablist">
            {TABS.map((tab) => (
              <button key={tab.key} role="tab" aria-selected={activeTab === tab.key} onClick={() => setActiveTab(tab.key)}>
                <span className="tab-label-full">{tab.label}</span>
                <span className="tab-label-short">{tab.short}</span>
              </button>
            ))}
          </div>

          {activeTab === "Overview" && <OverviewTab firstName={firstName} lastName={lastName} email={email} emailVerified={emailVerified} />}
          {activeTab === "Tickets" && <TicketsTab />}
          {activeTab === "Saved providers" && <SavedProvidersTab />}
          {activeTab === "Billing" && <BillingTab />}
        </div>

        <aside>
          <NotificationsCard />
          <button className="btn btn-danger btn-full" style={{ marginTop: 20 }} onClick={clearSession}>
            {t("userAccount.signOut")}
          </button>
        </aside>
      </main>
    </div>
  );
}
