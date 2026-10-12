// @vitest-environment jsdom
import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HelpRequestsPage } from "@/components/pages/help-requests-page";
import { defaultAlliance, makeMember } from "../helpers/members";
import { json, mockFetch, renderPage, t } from "./helpers";

vi.mock("next/navigation", async () => (await import("./helpers")).nextNavigationModule);
vi.mock("next/image", async () => (await import("./helpers")).nextImageModule);
vi.mock("next/link", async () => (await import("./helpers")).nextLinkModule);
vi.mock("next-auth/react", async () => (await import("./helpers")).nextAuthReactModule);
vi.mock("@/lib/nms-core/system.js", async () => (await import("./helpers")).nmsCoreModule);

const me = makeMember({ publicId: "me", nmsName: "Me", role: "user" });
const moderator = makeMember({ publicId: "mod", nmsName: "Mod", role: "moderator", simpleView: false });

function helpRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: "req-1",
    senderMemberId: "someone",
    subject: "Verdant Moon",
    body: "Need fuel near the moon",
    portal: "1234567890AB",
    galaxy: 0,
    senderName: "Someone",
    createdAt: "2026-03-01T10:00:00.000Z",
    replies: [],
    ...overrides,
  };
}

function renderHelp(member = me) {
  return renderPage(
    <HelpRequestsPage alliance={defaultAlliance} currentMember={member} missionCount={0} stationCount={0} />,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("HelpRequestsPage", () => {
  it("shows the empty state", async () => {
    mockFetch({ "GET /api/help-requests": [] });
    renderHelp();
    expect(await screen.findByText(t("help.no_requests"))).toBeInTheDocument();
  });

  it("shows the load error", async () => {
    mockFetch({ "GET /api/help-requests": json({ error: "help.error_unable_to_read" }, 500) });
    renderHelp();
    expect(await screen.findByText(t("help.error_unable_to_read"))).toBeInTheDocument();
  });

  it("lists requests with replies and only lets the author delete as a user", async () => {
    mockFetch({
      "GET /api/help-requests": [
        helpRequest({
          missionCode: "M-1",
          replies: [
            {
              id: "rep-1",
              senderMemberId: "me",
              senderName: "Me",
              body: "On it",
              createdAt: "2026-03-01T11:00:00.000Z",
            },
          ],
        }),
        helpRequest({
          id: "req-2",
          senderMemberId: "me",
          senderName: "Me",
          subject: "",
          body: "My own request",
          portal: undefined,
          galaxy: undefined,
        }),
      ],
    });
    renderHelp();

    const other = (await screen.findByText("Need fuel near the moon")).closest("article")!;
    expect(within(other).getByRole("link", { name: t("messages.open_mission") })).toHaveAttribute(
      "href",
      "/missions?search=M-1",
    );
    expect(within(other).getByRole("button", { name: t("planet.open_planet_details") })).toBeInTheDocument();
    const reply = screen.getByText("On it").closest("article")!;
    expect(within(reply).getByRole("button", { name: t("help.delete_request") })).toBeInTheDocument();
    const own = screen.getByText("My own request").closest("article")!;
    expect(within(own).getByRole("heading", { name: t("messages.no_subject") })).toBeInTheDocument();
    expect(within(own).getByRole("button", { name: t("help.delete_request") })).toBeInTheDocument();
    // Solo la propria risposta e la propria richiesta: la richiesta altrui non è eliminabile.
    expect(screen.getAllByRole("button", { name: t("help.delete_request") })).toHaveLength(2);
  });

  it("replies to a request and reloads the list", async () => {
    const { requests } = mockFetch({
      "GET /api/help-requests": vi
        .fn()
        .mockReturnValueOnce([helpRequest()])
        .mockReturnValue([
          helpRequest({
            replies: [
              {
                id: "rep-1",
                senderMemberId: "me",
                senderName: "Me",
                body: "Coming",
                createdAt: "2026-03-01T11:00:00.000Z",
              },
            ],
          }),
        ]),
      "POST /api/help-requests": vi
        .fn()
        .mockReturnValueOnce(json({ error: "help.request_unable_to_save" }, 500))
        .mockReturnValueOnce({ ok: true }),
    });
    const { user } = renderHelp();

    await user.click(await screen.findByRole("button", { name: t("messages.reply") }));
    await user.type(
      screen.getByRole("textbox", { name: t("messages.reply_to", { subject: "Verdant Moon" }) }),
      "Coming",
    );
    await user.click(screen.getByRole("checkbox", { name: t("profile.message_mission_only_notice") }));
    await user.click(screen.getByRole("button", { name: t("messages.send_reply") }));
    expect(await screen.findByText(t("help.request_unable_to_save"))).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: t("messages.send_reply") }));
    expect(await screen.findByText("Coming")).toBeInTheDocument();
    expect(requests("POST", "/api/help-requests")[1].body).toEqual({ message: "Coming", replyToId: "req-1" });
    expect(screen.queryByRole("button", { name: t("messages.send_reply") })).not.toBeInTheDocument();
  });

  it("cancels a reply", async () => {
    mockFetch({ "GET /api/help-requests": [helpRequest()] });
    const { user } = renderHelp();

    await user.click(await screen.findByRole("button", { name: t("messages.reply") }));
    await user.click(screen.getByRole("button", { name: t("common.cancel") }));
    expect(screen.queryByRole("button", { name: t("messages.send_reply") })).not.toBeInTheDocument();
  });

  it("lets a moderator delete requests and replies after confirmation", async () => {
    const changed = vi.fn();
    window.addEventListener("help-requests-changed", changed);
    const { requests } = mockFetch({
      "GET /api/help-requests": [
        helpRequest({
          replies: [
            {
              id: "rep-1",
              senderMemberId: "x",
              senderName: "X",
              body: "A reply",
              createdAt: "2026-03-01T11:00:00.000Z",
            },
          ],
        }),
      ],
      "DELETE /api/help-requests": vi
        .fn()
        .mockReturnValueOnce({ ok: true })
        .mockReturnValueOnce(json({ error: "help.request_unable_to_delete" }, 500))
        .mockReturnValueOnce({ ok: true }),
    });
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValue(true);
    const { user } = renderHelp(moderator);

    const reply = (await screen.findByText("A reply")).closest("article")!;
    await user.click(within(reply).getByRole("button", { name: t("help.delete_request") }));
    expect(requests("DELETE", "/api/help-requests")).toHaveLength(0);
    await user.click(within(reply).getByRole("button", { name: t("help.delete_request") }));
    await waitFor(() => expect(screen.queryByText("A reply")).not.toBeInTheDocument());
    expect(confirm).toHaveBeenLastCalledWith(t("help.confirm_delete_reply"));
    expect(requests("DELETE", "/api/help-requests")[0].body).toEqual({ id: "rep-1" });

    await user.click(screen.getByRole("button", { name: t("help.delete_request") }));
    expect(await screen.findByText(t("help.request_unable_to_delete"))).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: t("help.delete_request") }));
    expect(await screen.findByText(t("help.no_requests"))).toBeInTheDocument();
    expect(confirm).toHaveBeenLastCalledWith(t("help.confirm_delete_request"));
    expect(changed).toHaveBeenCalled();
    window.removeEventListener("help-requests-changed", changed);
  });

  it("opens the planet card of a request", async () => {
    mockFetch({ "GET /api/help-requests": [helpRequest()] });
    const { user } = renderHelp();

    await user.click(await screen.findByRole("button", { name: t("planet.open_planet_details") }));
    const dialog = await screen.findByRole("dialog", { name: "Verdant Moon" });
    await user.click(within(dialog).getByRole("button", { name: t("planet.close_planet_details") }));
    expect(screen.queryByRole("dialog", { name: "Verdant Moon" })).not.toBeInTheDocument();
  });
});
