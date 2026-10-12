import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginScreen } from "@/components/pages/login-screen";
import { getMissingAuthConfiguration } from "@/lib/local-auth";
import { MembersPage } from "@/components/pages/members-page";
import { PendingApproval } from "@/components/pages/pending-approval";
import { getCurrentMember } from "@/lib/authorization";
import { readAccessData } from "@/lib/access-store";
import { readMissions } from "@/lib/store";
import { readAllStationPortals } from "@/lib/stations-store";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const accessData = await readAccessData();
  const allianceName = accessData.alliance.name;
  const allianceLogoUrl = accessData.alliance.logoUrl;
  const requiredConfiguration = getMissingAuthConfiguration();
  if (requiredConfiguration.length > 0) return <LoginScreen allianceLogoUrl={allianceLogoUrl} allianceName={allianceName} missingConfiguration={requiredConfiguration} />;

  const session = await auth();
  if (!session?.user?.email) return <LoginScreen allianceLogoUrl={allianceLogoUrl} allianceName={allianceName} />;

  const member = await getCurrentMember({ allowPending: true, allowBlocked: true });
  if (!member) return <LoginScreen allianceLogoUrl={allianceLogoUrl} allianceName={allianceName} />;
  if (member.membershipStatus !== "approved") return <PendingApproval member={member} />;
  if (member.role !== "admin" && member.role !== "moderator") redirect("/");

  const [missions, stations] = await Promise.all([readMissions(), readAllStationPortals()]);
  const missionOwnerIds = new Set(missions.flatMap((mission) => [mission.assignedMemberId, mission.createdByMemberId, mission.stationOwnerMemberId].filter(Boolean) as string[]));
  const stationOwnerIds = new Set(stations.map((station) => station.ownerId));
  return <MembersPage
    memberActivity={{ missionOwnerIds: [...missionOwnerIds], stationOwnerIds: [...stationOwnerIds] }}
    alliance={accessData.alliance}
    currentMember={member}
    missionCount={missions.length}
    sidebarStationCount={stations.length}
    sidebarOfflineCount={accessData.members.filter((item) => item.offline).length}
    sidebarUserCount={accessData.members.filter((item) => !item.offline).length}
  />;
}
