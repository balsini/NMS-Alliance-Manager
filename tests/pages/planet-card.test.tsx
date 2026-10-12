// @vitest-environment jsdom
import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlanetCard } from "@/components/modals/planet-card";
import { json, mockFetch, renderPage, t } from "./helpers";

vi.mock("next/image", async () => (await import("./helpers")).nextImageModule);
vi.mock("@/lib/nms-core/system.js", async () => (await import("./helpers")).nmsCoreModule);

const lushPlanet = {
  lines: {
    headline: { word: "Verdant Moon" },
    band: {
      type: { word: "Lush" },
      size: { word: "Large" },
      weather: { word: "Humid" },
      fauna: { word: "Ample", stars: 2 },
      features: [{ word: "Caves" }, { word: "Arches" }],
      star: { word: "Yellow" },
      economy: { word: "Trading", marks: [{ word: "Wealthy" }] },
      race: { word: "Gek" },
    },
  },
  sky: { day: "#AABBCC", night: "#112233" },
  pictures: { disc: "/planets/verdant.png" },
  carries: [
    { name: "Copper", kind: "mineral" },
    { name: "Star Bulb", kind: "plant" },
    { name: "Ancient Bones", kind: "component" },
    { name: "Gold", kind: "tradeable" },
    { name: "Mystery", kind: "strange" },
  ],
  paradise: true,
};

const barrenPlanet = { lines: { band: { type: { word: "Barren" } } } };

function renderCard(props: Partial<Parameters<typeof PlanetCard>[0]> = {}) {
  const onClose = vi.fn();
  const view = renderPage(
    <PlanetCard galaxy={0} onClose={onClose} portal="1234567890AB" title="Mission planet" {...props} />,
  );
  return { ...view, onClose };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("PlanetCard", () => {
  it("loads every planet in the system and switches between them", async () => {
    const { calls } = mockFetch({
      "/api/missions/planet": ({ url }: { url: URL }) => {
        const address = url.searchParams.get("address");
        if (address === "1234567890AB") return { planet: lushPlanet };
        if (address === "2234567890AB") return { planet: barrenPlanet };
        return json({ error: "missing" }, 404);
      },
    });
    const { user } = renderCard({ contextLabel: "Euclid · Alpha", missionDescription: "Find the caves" });

    expect(screen.getByText(t("common.loading_archived_details"))).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: /Verdant Moon/ })).toBeInTheDocument();
    expect(screen.getByText("Find the caves")).toBeInTheDocument();
    expect(screen.getByText("Euclid · Alpha")).toBeInTheDocument();
    expect(screen.getByText(t("planet.paradise"))).toBeInTheDocument();
    expect(screen.getByText("Caves, Arches")).toBeInTheDocument();
    expect(screen.getByText("Ample · ★★☆")).toBeInTheDocument();
    expect(screen.getByLabelText(`${t("common.day")} #AABBCC`)).toBeInTheDocument();
    expect(screen.getByText("Copper")).toBeInTheDocument();
    expect(screen.getByText("Mystery")).toBeInTheDocument();
    expect(document.querySelector(".planet-card-image")).toHaveAttribute(
      "src",
      "https://nmsalmanac.com/api/planets/verdant.png",
    );
    // Planet indexes 1, 2 (from nms-core) and 1 again from the portal: two requests.
    expect(calls.map((call) => call.url.searchParams.get("address"))).toEqual(["1234567890AB", "2234567890AB"]);

    const tabs = screen.getByRole("navigation", { name: t("planet.planets_in_system") });
    await user.click(within(tabs).getByRole("button", { name: "Barren" }));
    expect(within(tabs).getByRole("button", { name: "Barren" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("2234567890AB", { selector: ".planet-intro-code" })).toBeInTheDocument();
  });

  it("shows the empty and error messages", async () => {
    mockFetch({ "/api/missions/planet": json({ error: "planet.almanac_lookup_failed" }, 502) });
    renderCard();

    expect(await screen.findByText(t("planet.almanac_lookup_failed"))).toBeInTheDocument();
  });

  it("explains when nothing is archived", async () => {
    mockFetch({});
    renderCard();

    expect(await screen.findByText(t("planet.no_almanac_details_are_archived_for_this_mission"))).toBeInTheDocument();
  });

  it("uses the initial data without fetching and closes", async () => {
    const { fetchMock } = mockFetch({});
    const { user, onClose } = renderCard({
      initialPlanetData: lushPlanet,
      initialPlanetPortal: "1234567890AB",
      inlinePreview: true,
    });

    expect(screen.getByRole("heading", { name: /Verdant Moon/ })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: t("planet.close_planet_details") }));
    expect(onClose).toHaveBeenCalled();
  });

  it("sends a help request for the selected planet", async () => {
    const changed = vi.fn();
    window.addEventListener("help-requests-changed", changed);
    const { requests } = mockFetch({
      "POST /api/help-requests": vi
        .fn()
        .mockReturnValueOnce(json({ error: "help.request_unable_to_save" }, 500))
        .mockReturnValueOnce({ ok: true }),
    });
    const { user } = renderCard({ initialPlanetData: lushPlanet });

    await user.click(screen.getByRole("button", { name: t("help.request_help") }));
    const send = screen.getByRole("button", { name: t("help.send_request") });
    expect(send).toBeDisabled();
    await user.type(
      screen.getByRole("textbox", { name: t("help.request_help_for", { subject: "Verdant Moon" }) }),
      "Need fuel",
    );
    expect(send).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: t("profile.message_mission_only_notice") }));
    await user.click(send);
    expect(await screen.findByText(t("help.request_unable_to_save"))).toBeInTheDocument();

    await user.click(send);
    expect(await screen.findByText(t("help.request_sent"))).toBeInTheDocument();
    expect(requests("POST", "/api/help-requests")[1].body).toEqual({
      message: "Need fuel",
      subject: "Verdant Moon",
      portal: "1234567890AB",
      galaxy: 0,
    });
    await waitFor(() => expect(changed).toHaveBeenCalled());
    window.removeEventListener("help-requests-changed", changed);
  });
});
