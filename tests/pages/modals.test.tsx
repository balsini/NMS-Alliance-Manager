// @vitest-environment jsdom
import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminPanel } from "@/components/modals/admin-panel";
import { MemberCardDialog } from "@/components/modals/member-card-dialog";
import { MemberProfilePanel } from "@/components/modals/member-profile-panel";
import { defaultAlliance, makeMember } from "../helpers/members";
import { json, mockFetch, renderPage, t } from "./helpers";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("AdminPanel", () => {
  function renderAdmin() {
    const onClose = vi.fn();
    const onSaved = vi.fn();
    const view = renderPage(<AdminPanel onClose={onClose} onSaved={onSaved} />);
    return { ...view, onClose, onSaved };
  }

  it("loads the settings and saves the edited values", async () => {
    const saved = {
      ...defaultAlliance,
      name: "New Name",
      discordUrl: "https://discord.gg/abc",
      heroGradientMode: "left",
    };
    const { requests } = mockFetch({
      "GET /api/alliance": { ...defaultAlliance, bannerUrl: "/banner.png" },
      "PATCH /api/alliance": saved,
    });
    const { user, onSaved, onClose } = renderAdmin();

    const name = screen.getByRole("textbox", { name: t("admin.alliance_name") });
    await waitFor(() => expect(name).toHaveValue("Test Alliance"));
    await user.clear(name);
    expect(screen.getByRole("button", { name: t("admin.save_settings") })).toBeDisabled();
    await user.type(name, "New Name");
    await user.type(screen.getByRole("textbox", { name: t("admin.discord_invite") }), "https://discord.gg/abc");
    await user.type(screen.getByRole("textbox", { name: t("admin.telegram_link") }), "https://t.me/x");
    await user.click(screen.getByRole("button", { name: t("common.text_only") }));
    expect(screen.getByRole("button", { name: t("common.text_only") })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: t("common.none") }));
    await user.click(screen.getByRole("button", { name: t("common.text_only") }));
    await user.click(screen.getByRole("button", { name: t("admin.save_settings") }));

    expect(await screen.findByText(t("admin.alliance_settings_saved"))).toBeInTheDocument();
    expect(requests("PATCH", "/api/alliance")[0].body).toMatchObject({
      name: "New Name",
      discordUrl: "https://discord.gg/abc",
      telegramUrl: "https://t.me/x",
      heroGradientMode: "left",
      bannerUrl: "/banner.png",
    });
    expect(onSaved).toHaveBeenCalledWith(saved);

    await user.click(screen.getByRole("button", { name: t("common.close") }));
    expect(onClose).toHaveBeenCalled();
  });

  it("shows load and save errors", async () => {
    mockFetch({
      "GET /api/alliance": json({ error: "Admins only." }, 403),
      "PATCH /api/alliance": json({ error: "Invalid URL." }, 400),
    });
    const { user, onSaved } = renderAdmin();

    expect(await screen.findByText("Admins only.")).toBeInTheDocument();
    await user.type(screen.getByRole("textbox", { name: t("admin.alliance_name") }), "Name");
    await user.click(screen.getByRole("button", { name: t("admin.save_settings") }));
    expect(await screen.findByText("Invalid URL.")).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("uploads the logo and reports upload failures", async () => {
    const { requests } = mockFetch({
      "GET /api/alliance": defaultAlliance,
      "POST /api/admin/upload": vi
        .fn()
        .mockReturnValueOnce({ url: "/api/alliance/logo.png" })
        .mockReturnValueOnce(json({ error: "Too large." }, 413)),
    });
    const { user, container } = renderAdmin();
    const [logoInput, bannerInput] = Array.from(
      container.ownerDocument.querySelectorAll<HTMLInputElement>("input[type=file]"),
    );

    await user.upload(logoInput, new File(["png"], "logo.png", { type: "image/png" }));
    expect(await screen.findByText(t("admin.image_uploaded_save_to_publish_the_changes"))).toBeInTheDocument();
    expect(requests("POST", "/api/admin/upload")[0].body).toBeInstanceOf(FormData);
    expect(container.ownerDocument.querySelector(".logo-preview")).toHaveStyle({
      backgroundImage: 'url("/api/alliance/logo.png")',
    });

    await user.upload(bannerInput, new File(["png"], "banner.png", { type: "image/png" }));
    expect(await screen.findByText("Too large.")).toBeInTheDocument();
  });
});

describe("MemberProfilePanel", () => {
  it("saves the own profile including the simple view preference", async () => {
    const moderator = makeMember({
      role: "moderator",
      simpleView: false,
      nmsName: "Mod",
      nmsCode: "ABCDEFGHJKLMN",
      platforms: ["PC"],
      specialty: "explorer",
    });
    const onSaved = vi.fn();
    const onClose = vi.fn();
    const { requests } = mockFetch({ "PATCH /api/profile": { ...moderator, nmsName: "Moddy" } });
    const { user } = renderPage(<MemberProfilePanel member={moderator} onClose={onClose} onSaved={onSaved} />);

    expect(screen.getByText(moderator.email)).toBeInTheDocument();
    const name = screen.getByRole("textbox", { name: t("common.in_game_name") });
    await user.clear(name);
    await user.type(name, "Moddy");
    await user.type(screen.getByPlaceholderText("@username"), "@moddy");
    await user.click(screen.getByRole("checkbox", { name: "Xbox" }));
    await user.click(screen.getByRole("checkbox", { name: "PC" }));
    await user.click(screen.getByRole("radio", { name: t("common.builder") }));
    await user.click(screen.getByRole("checkbox", { name: t("profile.simple_view") }));
    await user.click(screen.getByRole("button", { name: t("profile.save_profile") }));

    expect(await screen.findByText(t("profile.profile_saved"))).toBeInTheDocument();
    expect(requests("PATCH", "/api/profile")[0].body).toEqual({
      nmsName: "Moddy",
      nmsCode: "ABCDEFGHJKLMN",
      telegramName: "@moddy",
      discordName: "",
      platforms: ["Xbox"],
      specialty: "builder",
      simpleView: true,
    });
    expect(onSaved).toHaveBeenCalledWith(expect.objectContaining({ nmsName: "Moddy" }));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("requires a valid friend code and shows save errors", async () => {
    const member = makeMember({ nmsCode: "", specialty: "" });
    mockFetch({ "PATCH /api/profile": json({ error: "profile.invalid" }, 400) });
    const onClose = vi.fn();
    const { user } = renderPage(<MemberProfilePanel member={member} onClose={onClose} onSaved={vi.fn()} />);

    expect(screen.queryByRole("checkbox", { name: t("profile.simple_view") })).not.toBeInTheDocument();
    const save = screen.getByRole("button", { name: t("profile.save_profile") });
    const code = screen.getByPlaceholderText("BMPE-S0B9-RCDMT");
    await user.type(code, "abcd efgh");
    expect(code).toHaveValue("ABCD-EFGH");
    await user.click(screen.getByRole("radio", { name: t("common.explorer") }));
    expect(save).toBeDisabled();
    await user.type(code, "jklmn");
    expect(save).toBeEnabled();
    await user.click(save);
    expect(await screen.findByText(t("profile.invalid"))).toBeInTheDocument();

    const [headerClose, footerClose] = screen.getAllByRole("button", { name: t("common.close") });
    await user.click(headerClose);
    await user.click(footerClose);
    expect(onClose).toHaveBeenCalledTimes(2);
  });
});

describe("MemberCardDialog", () => {
  const profile = {
    publicId: "p1",
    name: "Pilot Real",
    image: "",
    nmsName: "Pilot",
    platforms: ["PC", "Xbox"],
    specialty: "ranger",
    nmsCode: "ABCD-EFGH-JKLMN",
    telegramName: "@pilot",
    discordName: "pilot#1",
    role: "moderator",
  };

  it("shows the profile and sends a mission message", async () => {
    const onClose = vi.fn();
    const { requests } = mockFetch({
      "/api/members": profile,
      "POST /api/messages": vi
        .fn()
        .mockReturnValueOnce(json({ error: "profile.message_unable_to_save" }, 500))
        .mockReturnValueOnce({ ok: true }),
    });
    const { user } = renderPage(
      <MemberCardDialog
        memberId="p1"
        messageContext={{ type: "mission", missionCode: "M-1", subjectLabel: "Survey Alpha" }}
        onClose={onClose}
      />,
    );

    expect(screen.getByText(t("profile.loading_profile"))).toBeInTheDocument();
    expect(await screen.findByText("Pilot")).toBeInTheDocument();
    expect(screen.getByText("PC, Xbox")).toBeInTheDocument();
    expect(screen.getByText("@pilot")).toBeInTheDocument();
    expect(screen.getByText(t("common.moderator"))).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: t("profile.leave_a_message") }));
    expect(screen.getByText("Survey Alpha")).toBeInTheDocument();
    const send = screen.getByRole("button", { name: t("profile.send_message") });
    await user.type(screen.getByRole("textbox", { name: t("profile.message_text") }), "Hello there");
    expect(send).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: t("profile.message_mission_only_notice") }));
    await user.click(send);
    expect(await screen.findByText(t("profile.message_unable_to_save"))).toBeInTheDocument();

    await user.click(send);
    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(requests("POST", "/api/messages")[1].body).toEqual({
      recipientId: "p1",
      message: "Hello there",
      context: { type: "mission", missionCode: "M-1", subjectLabel: "Survey Alpha" },
    });
  });

  it("loads the planet subject for planet messages and can go back", async () => {
    const { requests } = mockFetch({
      "/api/members": profile,
      "GET /api/messages": { subject: "Verdant Moon (planet 2)" },
    });
    const { user } = renderPage(
      <MemberCardDialog
        memberId="p1"
        messageContext={{ type: "planet", portal: "1234567890AB", galaxy: 3, subjectLabel: "" }}
        onClose={vi.fn()}
      />,
    );

    await user.click(await screen.findByRole("button", { name: t("profile.leave_a_message") }));
    expect(await screen.findByText("Verdant Moon (planet 2)")).toBeInTheDocument();
    const subjectCall = requests("GET", "/api/messages")[0];
    expect(Object.fromEntries(subjectCall.url.searchParams)).toEqual({
      recipientId: "p1",
      portal: "1234567890AB",
      galaxy: "3",
    });

    await user.click(screen.getByRole("button", { name: t("common.cancel") }));
    expect(screen.getByRole("heading", { name: t("profile.nms_profile") })).toBeInTheDocument();
  });

  it("hides messaging for offline players and shows load errors", async () => {
    mockFetch({ "/api/members": { ...profile, offline: true, nmsName: "", specialty: "", platforms: [] } });
    renderPage(
      <MemberCardDialog
        memberId="p1"
        messageContext={{ type: "mission", missionCode: "M-1", subjectLabel: "" }}
        onClose={vi.fn()}
      />,
    );

    expect(await screen.findByText(t("profile.no_specialty_specified"))).toBeInTheDocument();
    expect(screen.getByText(t("profile.no_platforms_specified"))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: t("profile.leave_a_message") })).not.toBeInTheDocument();
  });

  it("shows the profile load error", async () => {
    mockFetch({ "/api/members": json({ error: "Member not found." }, 404) });
    const onClose = vi.fn();
    const { user } = renderPage(
      <MemberCardDialog
        memberId="p1"
        messageContext={{ type: "mission", missionCode: "M-1", subjectLabel: "" }}
        onClose={onClose}
      />,
    );

    expect(await screen.findByText("Member not found.")).toBeInTheDocument();
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: t("common.close") }));
    expect(onClose).toHaveBeenCalled();
  });
});
