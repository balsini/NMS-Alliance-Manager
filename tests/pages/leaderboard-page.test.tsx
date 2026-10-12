// @vitest-environment jsdom
import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LeaderboardPage, type LeaderboardBoard } from "@/components/pages/leaderboard-page";
import { defaultAlliance, makeMember } from "../helpers/members";
import { mockFetch, renderPage, t } from "./helpers";

vi.mock("next/navigation", async () => (await import("./helpers")).nextNavigationModule);
vi.mock("next/image", async () => (await import("./helpers")).nextImageModule);
vi.mock("next/link", async () => (await import("./helpers")).nextLinkModule);
vi.mock("next-auth/react", async () => (await import("./helpers")).nextAuthReactModule);

const me = makeMember({ publicId: "me", nmsName: "Me" });

function entry(index: number, specialty = "explorer") {
  return {
    publicId: index === 0 ? "me" : `p${index}`,
    name: `Pilot ${index}`,
    image: index === 1 ? "/avatar.png" : "",
    specialty,
    count: 20 - index,
  };
}

const boards: LeaderboardBoard[] = [
  {
    id: "alliance_stats",
    title: "leaderboard.board_alliance",
    empty: "",
    entries: [],
    stats: [{ label: "leaderboard.stat_stations", value: 7 }],
  },
  {
    id: "stations",
    title: "leaderboard.board_stations",
    empty: "leaderboard.empty_stations",
    entries: Array.from({ length: 12 }, (_, index) => entry(index)),
  },
  { id: "missions", title: "leaderboard.board_missions", empty: "leaderboard.empty_missions", entries: [] },
  {
    id: "ranger_tasks",
    title: "common.ranger",
    empty: "leaderboard.empty_task",
    role: "ranger",
    entries: [],
    sections: [
      {
        id: "station_claimed",
        title: "system.station_claimed",
        entries: [entry(1, "ranger"), entry(2, "builder"), entry(3, ""), entry(4, "ranger")],
      },
      { id: "renamed", title: "system.renamed", entries: [] },
    ],
  },
];

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LeaderboardPage", () => {
  it("renders stats, top ten lists, role widgets and empty boards", () => {
    mockFetch({});
    renderPage(
      <LeaderboardPage
        alliance={defaultAlliance}
        boards={boards}
        currentMember={me}
        missionCount={0}
        stationCount={0}
      />,
    );

    const stats = screen.getByRole("heading", { name: t("leaderboard.board_alliance") }).closest("section")!;
    expect(within(stats).getByText(t("leaderboard.stat_stations")).nextSibling).toHaveTextContent("7");

    const stations = screen.getByRole("heading", { name: t("leaderboard.board_stations") }).closest("section")!;
    const rows = within(stations).getAllByRole("listitem");
    expect(rows).toHaveLength(10);
    expect(rows[0]).toHaveClass("leaderboard-row-me");
    expect(within(rows[1]).getByText("Pilot 1")).toBeInTheDocument();

    const missions = screen.getByRole("heading", { name: t("leaderboard.board_missions") }).closest("section")!;
    expect(within(missions).getByText(t("leaderboard.empty_missions"))).toBeInTheDocument();

    const ranger = screen.getByRole("heading", { name: t("common.ranger"), level: 3 }).closest("section")!;
    expect(within(ranger).getAllByRole("listitem")).toHaveLength(3);
    expect(within(ranger).getByRole("heading", { name: t("system.station_claimed") })).toBeInTheDocument();
    expect(within(ranger).getByText(t("leaderboard.empty_task"))).toBeInTheDocument();
    expect(within(ranger).getAllByRole("img", { name: t("common.ranger") }).length).toBeGreaterThan(0);
  });

  it("opens the own profile panel", async () => {
    mockFetch({});
    const { user } = renderPage(
      <LeaderboardPage alliance={defaultAlliance} boards={[]} currentMember={me} missionCount={0} stationCount={0} />,
    );

    await user.click(screen.getByRole("button", { name: t("profile.my_profile") }));
    expect(screen.getByRole("dialog", { name: t("profile.my_nms_profile") })).toBeInTheDocument();
  });
});
