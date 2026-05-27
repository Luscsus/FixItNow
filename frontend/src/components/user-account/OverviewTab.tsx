import { PersonalInfoCard } from "@/components/user-account/PersonalInfoCard";
import { RecentTicketsCard } from "@/components/user-account/RecentTicketsCard";
import { BuildingsLocationsCard } from "@/components/user-account/BuildingsLocationsCard";

interface OverviewTabProps {
  firstName: string;
  lastName: string;
  email: string | undefined;
  emailVerified?: boolean;
}

export function OverviewTab({ firstName, lastName, email, emailVerified }: OverviewTabProps) {
  return (
    <>
      <PersonalInfoCard
        firstName={firstName}
        lastName={lastName}
        email={email}
        emailVerified={emailVerified}
      />
      <RecentTicketsCard />
      <BuildingsLocationsCard />
    </>
  );
}
