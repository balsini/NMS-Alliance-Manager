// @vitest-environment jsdom
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MissionForm } from "@/components/modals/mission-form";
import { makeMember } from "../helpers/members";
import { json, makeMission, mockFetch, renderPage, t } from "./helpers";

vi.mock("next/image", async () => (await import("./helpers")).nextImageModule);
vi.mock("@/lib/nms-core/system.js", async () => (await import("./helpers")).nmsCoreModule);

type FormProps = Parameters<typeof MissionForm>[0];

function renderForm(props: Partial<FormProps> = {}) {
  const handlers = {
    onClose: vi.fn(),
    onSave: vi.fn(async () => undefined),
    onDelete: vi.fn(async () => undefined),
  };
  const view = renderPage(<MissionForm members={[]} mission={null} stationOwners={[]} {...handlers} {...props} />);
  return { ...view, ...handlers, dialog: screen.getByRole("dialog") };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MissionForm", () => {
  it("keeps submit disabled until the portal address is valid and checked", async () => {
    mockFetch({
      "/api/missions/verify-system": { found: true, systemLabel: "Euclid Prime" },
      "GET /api/planet-status": { systemStatuses: [] },
    });
    const { user, dialog, onSave, onClose } = renderForm();
    const create = within(dialog).getByRole("button", { name: t("missions.create_mission") });
    expect(create).toBeDisabled();

    // Un submit forzato con l'indirizzo vuoto mostra l'errore di validazione.
    fireEvent.submit(dialog.querySelector("form")!);
    expect(
      await within(dialog).findByText(t("stations.enter_a_valid_system_or_portal_code_before_saving")),
    ).toBeInTheDocument();

    await user.type(
      within(dialog).getByRole("textbox", { name: t("stations.12_glyph_portal_address") }),
      "1234567890AB",
    );
    await waitFor(() => expect(create).toBeEnabled(), { timeout: 2000 });
    expect(within(dialog).getByDisplayValue("Testara System")).toBeInTheDocument();
    expect(within(dialog).getByDisplayValue("Euclid Prime")).toBeInTheDocument();

    await user.type(within(dialog).getByRole("textbox", { name: t("missions.mission_notes") }), "Bring a ship");
    await user.click(create);

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        systemAddress: "1234567890AB",
        title: "Testara System",
        system: "Euclid Prime",
        systemVerified: true,
        systemLabelFromAlmanac: true,
        notes: "Bring a ship",
        targetSpecialty: "explorer",
      }),
    );
  });

  it("shows the save error and stays open", async () => {
    mockFetch({ "/api/missions/verify-system": { found: false }, "GET /api/planet-status": { systemStatuses: [] } });
    const { user, dialog, onClose } = renderForm({
      onSave: vi.fn(async () => {
        throw new Error("Duplicate mission.");
      }),
    });

    await user.type(
      within(dialog).getByRole("textbox", { name: t("stations.12_glyph_portal_address") }),
      "1234567890AB",
    );
    const create = within(dialog).getByRole("button", { name: t("missions.create_mission") });
    await waitFor(() => expect(create).toBeEnabled(), { timeout: 2000 });
    await user.click(create);

    expect(await within(dialog).findByText("Duplicate mission.")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("drops progress for missions without a single specialty", async () => {
    mockFetch({ "/api/missions/verify-system": { found: false }, "GET /api/planet-status": { systemStatuses: [] } });
    const onSave = vi.fn(async () => undefined);
    const { user, dialog } = renderForm({
      onSave,
      initialValues: { title: "Everyone", targetSpecialty: "all", progress: 40 },
    });

    expect(within(dialog).queryByRole("slider")).not.toBeInTheDocument();
    await user.type(
      within(dialog).getByRole("textbox", { name: t("stations.12_glyph_portal_address") }),
      "1234567890AB",
    );
    const create = within(dialog).getByRole("button", { name: t("missions.create_mission") });
    await waitFor(() => expect(create).toBeEnabled(), { timeout: 2000 });
    await user.click(create);

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Everyone", targetSpecialty: "all", progress: 0 }),
    );
  });

  it("loads and toggles the shared planet tasks when editing", async () => {
    const mission = makeMission({ id: "m-1", title: "Edit me", targetSpecialty: "explorer", progress: 0 });
    const onSystemStatusesSaved = vi.fn();
    const { requests } = mockFetch({
      "/api/missions/verify-system": { found: true },
      "GET /api/planet-status": { systemStatuses: ["mapped"] },
      "PATCH /api/planet-status": { systemStatuses: ["mapped", "planets_classified"] },
    });
    const { user, dialog } = renderForm({ mission, onSystemStatusesSaved });

    expect(within(dialog).getByRole("heading", { name: t("missions.edit_mission") })).toBeInTheDocument();
    const mapped = await within(dialog).findByRole("checkbox", { name: t("mapped") });
    await waitFor(() => expect(mapped).toBeChecked());
    // La missione senza avanzamento parte dal minimo calcolato dalle voci spuntate.
    expect(within(dialog).getByText("27%")).toBeInTheDocument();

    const classified = within(dialog).getByRole("checkbox", { name: t("planets_classified") });
    await waitFor(() => expect(classified).toBeEnabled(), { timeout: 2000 });
    await user.click(classified);

    await waitFor(() =>
      expect(onSystemStatusesSaved).toHaveBeenCalledWith("1234567890AB", 0, ["mapped", "planets_classified"]),
    );
    expect(requests("PATCH", "/api/planet-status")[0].body).toEqual({
      portal: "1234567890AB",
      galaxy: 0,
      systemStatuses: ["mapped", "planets_classified"],
    });
    expect(classified).toBeChecked();
  });

  it("shows planet task load and save errors", async () => {
    mockFetch({
      "/api/missions/verify-system": { found: true },
      "GET /api/planet-status": json({ error: "Status store offline." }, 503),
    });
    const { dialog } = renderForm({ mission: makeMission() });

    expect(await within(dialog).findByText("Status store offline.")).toBeInTheDocument();
    expect(within(dialog).queryByRole("checkbox", { name: t("mapped") })).not.toBeInTheDocument();
  });

  it("reports a failed planet task save", async () => {
    mockFetch({
      "/api/missions/verify-system": { found: true },
      "GET /api/planet-status": { systemStatuses: [] },
      "PATCH /api/planet-status": json({ error: "Read only." }, 403),
    });
    const { user, dialog } = renderForm({ mission: makeMission() });

    const mapped = await within(dialog).findByRole("checkbox", { name: t("mapped") });
    await waitFor(() => expect(mapped).toBeEnabled(), { timeout: 2000 });
    await user.click(mapped);

    expect(await within(dialog).findByText("Read only.")).toBeInTheDocument();
    expect(mapped).not.toBeChecked();
  });

  it("shows only the role tasks in the simplified form", async () => {
    mockFetch({ "/api/missions/verify-system": { found: true }, "GET /api/planet-status": { systemStatuses: [] } });
    const { dialog } = renderForm({ mission: makeMission(), simplified: true, simplifiedStatusRole: "ranger" });

    expect(await within(dialog).findByRole("checkbox", { name: t("station_claimed") })).toBeInTheDocument();
    expect(within(dialog).queryByRole("checkbox", { name: t("mapped") })).not.toBeInTheDocument();
  });

  it("assigns a member, picks the station discoverer and disables covered specialties", async () => {
    mockFetch({ "/api/missions/verify-system": { found: true }, "GET /api/planet-status": { systemStatuses: [] } });
    const assignee = makeMember({
      publicId: "assignee-1",
      nmsName: "Helper",
      specialty: "builder",
      nmsCode: "ABCDEFGHJKLMN",
      platforms: ["PC", "Xbox"],
    });
    const onSave = vi.fn(async () => undefined);
    const existing = makeMission({ id: "other", targetSpecialty: "builder" });
    const { user, dialog } = renderForm({
      onSave,
      members: [assignee],
      existingMissions: [existing],
      initialValues: { systemAddress: "1234567890AB", title: "Seeded" },
      stationOwners: [{ portal: "1234567890AB", galaxy: 0, ownerId: "owner-1", ownerName: "Discoverer" }],
    });

    const specialty = within(dialog).getByRole("combobox", { name: t("missions.mission_for") });
    expect(within(specialty).getByRole("option", { name: t("common.builders") })).toBeDisabled();
    expect(within(specialty).getByRole("option", { name: t("common.all") })).toBeDisabled();
    await user.selectOptions(specialty, "ranger");

    await user.selectOptions(
      within(dialog).getByRole("combobox", { name: t("missions.system_discoverer") }),
      "owner-1",
    );
    const assign = within(dialog).getByRole("combobox", { name: t("common.assign_to") });
    expect(
      within(assign).getByRole("option", { name: `Helper · ${t("common.builder")} · ABCDEFGHJKLMN · PC, Xbox` }),
    ).toBeInTheDocument();
    await user.selectOptions(assign, "assignee-1");
    await user.selectOptions(
      within(dialog).getByRole("combobox", { name: t("missions.priority_field_label") }),
      "urgent",
    );
    await user.selectOptions(
      within(dialog).getByRole("combobox", { name: t("common.status_field_label") }),
      "in_progress",
    );
    fireEvent.change(within(dialog).getByRole("slider"), { target: { value: "35" } });

    const create = within(dialog).getByRole("button", { name: t("missions.create_mission") });
    await waitFor(() => expect(create).toBeEnabled(), { timeout: 2000 });
    await user.click(create);

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        targetSpecialty: "ranger",
        stationOwnerMemberId: "owner-1",
        assignedMemberId: "assignee-1",
        assignedTo: "Helper",
        priority: "urgent",
        status: "in_progress",
        progress: 35,
      }),
    );
  });

  it("clears the address-dependent fields when the galaxy changes", async () => {
    mockFetch({ "/api/missions/verify-system": { found: true }, "GET /api/planet-status": { systemStatuses: [] } });
    const { user, dialog } = renderForm({
      initialValues: { systemAddress: "1234567890AB", stationOwnerMemberId: "owner-1", stationOwnerName: "Old owner" },
    });

    const discoverer = within(dialog).getByRole("combobox", { name: t("missions.system_discoverer") });
    expect(discoverer).toHaveValue("owner-1");
    await user.selectOptions(within(dialog).getByRole("combobox", { name: t("stations.galaxy") }), "1");
    expect(discoverer).toHaveValue("");
  });

  it("deletes the mission after confirmation and reports failures", async () => {
    mockFetch({ "/api/missions/verify-system": { found: true }, "GET /api/planet-status": { systemStatuses: [] } });
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValue(true);
    const onDelete = vi.fn().mockRejectedValueOnce(new Error("Cannot delete.")).mockResolvedValueOnce(undefined);
    const { user, dialog, onClose } = renderForm({ mission: makeMission({ id: "m-9", title: "Remove me" }), onDelete });

    const remove = within(dialog).getByRole("button", { name: t("common.delete") });
    await user.click(remove);
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(remove);
    expect(await within(dialog).findByText("Cannot delete.")).toBeInTheDocument();

    await user.click(remove);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(onDelete).toHaveBeenLastCalledWith("m-9");
    expect(confirm).toHaveBeenCalledWith(t("common.delete_title", { title: "Remove me" }));
  });

  it("closes from the close and cancel buttons", async () => {
    mockFetch({});
    const { user, dialog, onClose } = renderForm();

    await user.click(within(dialog).getByRole("button", { name: t("common.close") }));
    await user.click(within(dialog).getByRole("button", { name: t("common.cancel") }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});
