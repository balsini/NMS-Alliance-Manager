"use client";

import { StationCardSimple } from "@/components/cards/station-card/simple";
import type { StationEntry } from "@/components/cards/station-card/parts";
import type { AllianceMember } from "@/lib/member-types";

type Sample = Readonly<{ portal: string; galaxy: number; response: Record<string, unknown> }>;

const rangerId = "guide-ranger";
const otherId = "guide-other";

const ranger: AllianceMember = {
  publicId: rangerId,
  email: "",
  name: "Ranger",
  image: "",
  nmsName: "Ranger",
  nmsCode: "",
  platforms: [],
  specialty: "ranger",
  role: "user",
  membershipStatus: "approved",
  approvedBy: "",
  approvedAt: "",
  lastLogin: "",
  simpleView: true,
};

const scenarios = [
  { title: "Tua stazione, senza missioni, con note", own: true, hasMissions: false, available: true, note: true },
  { title: "Tua stazione, senza missioni, senza note", own: true, hasMissions: false, available: true, note: false },
  { title: "Tua stazione, con missioni (es. solo Ranger) e altre ancora da creare", own: true, hasMissions: true, available: true, note: false },
  { title: "Tua stazione, con missioni e nessuna da creare", own: true, hasMissions: true, available: false, note: false },
  { title: "Stazione di un altro, senza missioni", own: false, hasMissions: false, available: true, note: false },
  { title: "Stazione di un altro, con missioni", own: false, hasMissions: true, available: false, note: false },
];

const renderedAt = Date.parse("2030-01-01T00:00:00.000Z");
const noop = () => undefined;

export function RangerStationExamples({ sample }: Readonly<{ sample: Sample }>) {
  return <div className="guide-examples">{scenarios.map((scenario) => {
    const station: StationEntry = {
      portal: sample.portal,
      galaxy: sample.galaxy,
      ownerId: scenario.own ? rangerId : otherId,
      ownerName: scenario.own ? "Tu" : "Altro Ranger",
      createdByMemberId: scenario.own ? rangerId : otherId,
      createdAt: "2020-01-01T00:00:00.000Z",
      note: scenario.note ? "Esempio di nota della stazione." : undefined,
      planet: { galaxy: sample.galaxy, response: sample.response },
      hasMissions: scenario.hasMissions,
      canOpenOwnSpecialtyMission: false,
      hasAssignedMission: false,
      missionStatus: scenario.hasMissions ? "in_progress" : "none",
      availableSpecialties: scenario.available ? (scenario.hasMissions ? ["explorer", "builder"] : ["all", "ranger", "explorer", "builder", "explorer_builder"]) : [],
    };
    return <figure className="guide-example" key={scenario.title}>
      <figcaption>{scenario.title}</figcaption>
      <ul className="station-list station-list-cards">
        <StationCardSimple
          canCreateMissions={false}
          canSeeAll={false}
          member={ranger}
          onCreateMission={noop}
          onEdit={noop}
          onOpenProfile={noop}
          onOpenStation={noop}
          onRemove={noop}
          onToggleStatus={noop}
          onViewNote={noop}
          planetStatuses={{}}
          planetStatusesLoaded
          renderedAt={renderedAt}
          savingStatusKeys={[]}
          station={station}
        />
      </ul>
    </figure>;
  })}</div>;
}
