import { getDashboardMatches } from '@/lib/dashboardData';
import HydraSectionPage from '@/components/HydraSectionPage';

export const revalidate = 10;

export default async function TeamPage({ params }) {
  const { teamName } = await params;
  const name = decodeURIComponent(teamName);
  return (
    <HydraSectionPage
      matches={await getDashboardMatches()}
      section="team"
      teamName={name}
    />
  );
}
