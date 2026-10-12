// @vitest-environment jsdom
import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlanetDestination } from "@/components/cards/planet-destination-card";
import { PlanetsPage } from "@/components/pages/planets-page";
import { defaultAlliance, makeMember } from "../helpers/members";
import { mockFetch, renderPage, t } from "./helpers";

vi.mock("next/navigation", async () => (await import("./helpers")).nextNavigationModule);
vi.mock("next/image", async () => (await import("./helpers")).nextImageModule);
vi.mock("next/link", async () => (await import("./helpers")).nextLinkModule);
vi.mock("next-auth/react", async () => (await import("./helpers")).nextAuthReactModule);
vi.mock("@/lib/nms-core/system.js", async () => (await import("./helpers")).nmsCoreModule);

const member = makeMember({ publicId: "me", nmsName: "Me" });

function planet(overrides: Partial<PlanetDestination> = {}): PlanetDestination {
  return {
    id: "1234567890AB:0",
    portal: "1234567890AB",
    planetPortal: "1234567890AB",
    planetNumber: 1,
    galaxy: 0,
    title: "Alpha mission",
    almanacName: "Verdant",
    almanacSearchIndex: "Verdant Lush humid",
    almanacFacts: [
      { label: "common.planet_type_label", value: "Lush" },
      { label: "planet.size", value: "Large" },
      { label: "planet.water", value: "Ocean" },
      { label: "planet.weather", value: "Humid" },
      { label: "planet.sentinels", value: "Low" },
    ],
    systemFacts: [
      { label: "planet.star", value: "Yellow" },
      { label: "common.economy", value: "Trading" },
      { label: "common.conflict", value: "Low" },
      { label: "common.race", value: "Gek" },
    ],
    planetType: "Lush",
    economyStars: 2,
    plants: ["Star Bulb"],
    minerals: ["Copper"],
    valuables: ["Gold"],
    dissonant: false,
    paradise: true,
    blackMarket: false,
    station: {
      id: "me:1234567890AB:0",
      portal: "1234567890AB",
      galaxy: 0,
      name: "Home Base",
      createdAt: "2026-01-01T00:00:00.000Z",
    },
    ...overrides,
  };
}

const frozen = planet({
  id: "2234567890AC:0",
  portal: "2234567890AC",
  planetPortal: "2234567890AC",
  planetNumber: 2,
  almanacName: "Glacia",
  almanacSearchIndex: "Glacia Frozen",
  almanacFacts: [
    { label: "common.planet_type_label", value: "Frozen" },
    { label: "planet.size", value: "Moon" },
  ],
  systemFacts: [
    { label: "planet.star", value: "Red" },
    { label: "common.race", value: "Unknown" },
  ],
  planetType: "Frozen",
  economyStars: undefined,
  plants: [],
  minerals: ["Dioxite"],
  valuables: [],
  dissonant: true,
  paradise: false,
  blackMarket: true,
  station: undefined,
});

function renderPlanets(props: Partial<Parameters<typeof PlanetsPage>[0]> = {}) {
  return renderPage(
    <PlanetsPage
      alliance={defaultAlliance}
      almanacLookupFailed={false}
      currentMember={member}
      missionCount={0}
      planets={[planet(), frozen]}
      stationCount={0}
      {...props}
    />,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

describe("PlanetsPage", () => {
  it("groups the planets by station and stores the planet count", async () => {
    mockFetch({});
    renderPlanets();

    expect(screen.getByRole("heading", { name: "Home Base" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: new RegExp(t("planet.no_associated_station")) })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: t("planet.black_market") })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: t("planet.open_station_in_stations", { station: "Home Base" }) }),
    ).toHaveAttribute("href", "/stations?search=1234567890AB");
    expect(screen.getByText(t("planet.paradise"))).toBeInTheDocument();
    expect(screen.getByText(t("planet.dissonant"))).toBeInTheDocument();
    await waitFor(() => expect(window.localStorage.getItem("nms-planet-count")).toBe("2"));
  });

  it("searches the almanac values", async () => {
    mockFetch({});
    const { user } = renderPlanets();

    await user.type(screen.getByRole("searchbox", { name: t("planet.search_almanac_values") }), "glacia");
    expect(screen.getByText("Glacia")).toBeInTheDocument();
    expect(screen.queryByText("Verdant")).not.toBeInTheDocument();

    await user.clear(screen.getByRole("searchbox", { name: t("planet.search_almanac_values") }));
    await user.type(screen.getByRole("searchbox", { name: t("planet.search_almanac_values") }), "home base");
    expect(screen.getByText("Verdant")).toBeInTheDocument();

    await user.clear(screen.getByRole("searchbox", { name: t("planet.search_almanac_values") }));
    await user.type(screen.getByRole("searchbox", { name: t("planet.search_almanac_values") }), "zzz");
    expect(screen.getByText(t("planet.no_planets_match_search"))).toBeInTheDocument();
  });

  it("filters with the filter panel and clears the filters", async () => {
    mockFetch({});
    const { user } = renderPlanets();

    const toggle = screen.getByRole("button", { name: t("planet.filters") });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    const type = screen.getByRole("combobox", { name: t("planet.filter_planet_type") });
    expect(
      within(type)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual([t("planet.all_planet_types"), "Frozen", "Lush"]);
    await user.selectOptions(type, "Lush");
    expect(screen.queryByText("Glacia")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: `${t("planet.remove_filter")}: ${t("planet.planet_type")}: Lush` }),
    ).toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: t("planet.filter_dissonant") }), "yes");
    expect(screen.getByText(t("planet.no_planets_match_filters"))).toBeInTheDocument();
    await user.click(
      screen.getByRole("button", {
        name: `${t("planet.remove_filter")}: ${t("planet.dissonant")}: ${t("planet.dissonant_yes")}`,
      }),
    );
    expect(screen.getByText("Verdant")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: t("planet.reset_filters") }));
    expect(screen.getByText("Glacia")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: t("planet.reset_filters") })).not.toBeInTheDocument();
  });

  it.each([
    ["planet.filter_star", "Red", "Glacia"],
    ["planet.filter_economy", "Trading", "Verdant"],
    ["planet.filter_race", "Gek", "Verdant"],
    ["planet.filter_size", "Moon", "Glacia"],
    ["planet.filter_water", "Ocean", "Verdant"],
    ["planet.filter_weather", "Humid", "Verdant"],
    ["planet.filter_conflict", "Low", "Verdant"],
    ["planet.filter_sentinels", "Low", "Verdant"],
    ["planet.filter_plants", "Star Bulb", "Verdant"],
    ["planet.filter_minerals", "Dioxite", "Glacia"],
    ["planet.filter_valuables", "Gold", "Verdant"],
    ["planet.filter_economy_stars", "2", "Verdant"],
    ["planet.filter_paradise", "yes", "Verdant"],
    ["planet.filter_pirate_system", "yes", "Glacia"],
  ])("filters by %s", async (label, value, visible) => {
    mockFetch({});
    const { user } = renderPlanets();

    await user.click(screen.getByRole("button", { name: t("planet.filters") }));
    await user.selectOptions(screen.getByRole("combobox", { name: t(label) }), value);

    expect(screen.getByText(visible)).toBeInTheDocument();
    expect(screen.queryByText(visible === "Glacia" ? "Verdant" : "Glacia")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: t("planet.reset_filters") })).toBeInTheDocument();
  });

  it("removes each active filter tag", async () => {
    mockFetch({});
    const { user } = renderPlanets();
    await user.click(screen.getByRole("button", { name: t("planet.filters") }));

    for (const [label, value] of [
      ["planet.filter_star", "Yellow"],
      ["planet.filter_economy", "Trading"],
      ["planet.filter_economy_stars", "2"],
      ["planet.filter_race", "Gek"],
      ["planet.filter_size", "Large"],
      ["planet.filter_paradise", "yes"],
      ["planet.filter_pirate_system", "no"],
      ["planet.filter_water", "Ocean"],
      ["planet.filter_weather", "Humid"],
      ["planet.filter_conflict", "Low"],
      ["planet.filter_sentinels", "Low"],
      ["planet.filter_plants", "Star Bulb"],
      ["planet.filter_minerals", "Copper"],
      ["planet.filter_valuables", "Gold"],
      ["planet.filter_dissonant", "no"],
    ]) {
      await user.selectOptions(screen.getByRole("combobox", { name: t(label) }), value);
    }
    expect(screen.getByText("Verdant")).toBeInTheDocument();

    const removeButtons = screen.getAllByRole("button", { name: new RegExp(`^${t("planet.remove_filter")}:`) });
    expect(removeButtons).toHaveLength(15);
    for (const button of removeButtons) await user.click(button);
    expect(screen.queryByRole("button", { name: t("planet.reset_filters") })).not.toBeInTheDocument();
    expect(screen.getByText("Glacia")).toBeInTheDocument();
  });

  it("opens the planet card on the selected planet", async () => {
    mockFetch({ "/api/missions/planet": { planet: { lines: { headline: { word: "Verdant" } } } } });
    const { user } = renderPlanets();

    await user.click(screen.getByRole("button", { name: /Verdant/ }));
    const dialog = await screen.findByRole("dialog", { name: "Home Base" });
    expect(await within(dialog).findByRole("heading", { name: /Verdant/ })).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: t("planet.close_planet_details") }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("warns about a partial almanac lookup and keeps the stored count", () => {
    mockFetch({});
    window.localStorage.setItem("nms-planet-count", "9");
    renderPlanets({ almanacLookupFailed: true, planets: [] });

    expect(screen.getByText(t("planet.almanac_partial_lookup_failed"))).toBeInTheDocument();
    expect(screen.getByText(t("planet.no_verified_mission_planets"))).toBeInTheDocument();
    expect(window.localStorage.getItem("nms-planet-count")).toBe("9");
  });

  it("shows the empty archive message", () => {
    mockFetch({});
    renderPlanets({ planets: [] });
    expect(screen.getByText(t("planet.no_mission_planets"))).toBeInTheDocument();
  });
});
