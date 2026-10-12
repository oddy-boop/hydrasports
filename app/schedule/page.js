import { getDashboardMatches } from '@/lib/dashboardData';
import HydraSectionPage from '@/components/HydraSectionPage';

export const revalidate = 10;

export default async function SchedulePage() {
  return <HydraSectionPage matches={await getDashboardMatches()} section="schedule" />;
}
