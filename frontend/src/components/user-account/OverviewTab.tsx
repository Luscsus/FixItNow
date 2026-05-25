import { PersonalInfoCard } from "@/components/user-account/PersonalInfoCard";
import { RecentTicketsCard } from "@/components/user-account/RecentTicketsCard";
import { BuildingsLocationsCard } from "@/components/user-account/BuildingsLocationsCard";

interface OverviewTabProps {
  firstName: string;
  lastName: string;
  email: string | undefined;
}

export function OverviewTab({ firstName, lastName, email }: OverviewTabProps) {
  return (
    <>
      <PersonalInfoCard firstName={firstName} lastName={lastName} email={email} />
      <RecentTicketsCard />
      <BuildingsLocationsCard />
    </>
  );
}
