import { getDashboardMatches } from '@/lib/dashboardData';
import HydraSectionPage from '@/components/HydraSectionPage';

export const revalidate = 10;

export default async function CompetitionsPage() {
  return <HydraSectionPage matches={await getDashboardMatches()} section="competitions" />;
}
