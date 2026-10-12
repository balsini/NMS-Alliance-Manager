// @vitest-environment jsdom
import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MessagesPage } from "@/components/pages/messages-page";
import { defaultAlliance, makeMember } from "../helpers/members";
import { json, mockFetch, renderPage, t } from "./helpers";

vi.mock("next/navigation", async () => (await import("./helpers")).nextNavigationModule);
vi.mock("next/image", async () => (await import("./helpers")).nextImageModule);
vi.mock("next/link", async () => (await import("./helpers")).nextLinkModule);
vi.mock("next-auth/react", async () => (await import("./helpers")).nextAuthReactModule);

const me = makeMember({ publicId: "me", nmsName: "Me", role: "user" });
const admin = makeMember({ publicId: "admin", nmsName: "Boss", role: "admin", simpleView: false });

function message(overrides: Record<string, unknown> = {}) {
  return {
    id: "msg-1",
    senderMemberId: "friend",
    recipientMemberId: "me",
    senderName: "Friend",
    recipientName: "Me",
    body: "Meet at the station",
    subject: "Planet Alpha",
    subjectType: "planet",
    portal: "1234567890AB",
    galaxy: 0,
    unread: true,
    createdAt: "2026-03-01T10:00:00.000Z",
    ...overrides,
  };
}

function renderMessages(member = me) {
  return renderPage(
    <MessagesPage alliance={defaultAlliance} currentMember={member} missionCount={0} stationCount={0} />,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("MessagesPage", () => {
  it("shows the empty state and the load error", async () => {
    mockFetch({ "GET /api/messages": [] });
    renderMessages();
    expect(await screen.findByText(t("messages.no_messages"))).toBeInTheDocument();
  });

  it("shows the API error when messages cannot be read", async () => {
    mockFetch({ "GET /api/messages": json({ error: "messages.error_unable_to_read" }, 500) });
    renderMessages();
    expect(await screen.findByText(t("messages.error_unable_to_read"))).toBeInTheDocument();
  });

  it("lists received messages with subject links and marks them read", async () => {
    const unreadChanged = vi.fn();
    window.addEventListener("messages-unread-changed", unreadChanged);
    const { requests } = mockFetch({
      "GET /api/messages": [
        message(),
        message({
          id: "msg-2",
          subject: "Mission M-7",
          subjectType: "mission",
          missionCode: "M-7",
          portal: undefined,
          unread: false,
          body: "Mission talk",
        }),
        message({
          id: "msg-3",
          senderMemberId: "me",
          recipientMemberId: "friend",
          senderName: "Me",
          recipientName: "Friend",
          subject: "",
          body: "Sent by me",
          unread: false,
        }),
      ],
      "PATCH /api/messages": { ok: true },
    });
    const { user } = renderMessages();

    expect(await screen.findByText("Meet at the station")).toBeInTheDocument();
    expect(screen.queryByText("Sent by me")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: t("messages.open_planet_station") })).toHaveAttribute(
      "href",
      "/stations?search=1234567890AB",
    );
    expect(screen.getByRole("link", { name: t("messages.open_mission") })).toHaveAttribute(
      "href",
      "/missions?search=M-7",
    );

    await user.click(screen.getByRole("button", { name: t("messages.mark_read") }));
    await waitFor(() => expect(requests("PATCH", "/api/messages")).toHaveLength(1));
    expect(requests("PATCH", "/api/messages")[0].body).toEqual({ messageIds: ["msg-1"] });
    expect(screen.queryByRole("button", { name: t("messages.mark_read") })).not.toBeInTheDocument();
    await waitFor(() => expect(unreadChanged).toHaveBeenCalled());
    window.removeEventListener("messages-unread-changed", unreadChanged);

    await user.click(screen.getByRole("tab", { name: new RegExp(t("messages.tab_sent")) }));
    expect(screen.getByText("Sent by me")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: t("messages.no_subject") })).toBeInTheDocument();
    expect(screen.queryByText("Meet at the station")).not.toBeInTheDocument();
  });

  it("expands threads and marks the replies read", async () => {
    const { requests } = mockFetch({
      "GET /api/messages": [
        message({ unread: false }),
        message({ id: "reply-1", replyToId: "msg-1", body: "Sure, see you", unread: true }),
      ],
      "PATCH /api/messages": { ok: true },
    });
    const { user } = renderMessages();

    const toggle = await screen.findByRole("button", { name: t("messages.show_replies", { count: 1 }) });
    expect(screen.queryByText("Sure, see you")).not.toBeInTheDocument();
    await user.click(toggle);
    expect(screen.getByText("Sure, see you")).toBeInTheDocument();
    await waitFor(() => expect(requests("PATCH", "/api/messages")[0]?.body).toEqual({ messageIds: ["reply-1"] }));

    await user.click(screen.getByRole("button", { name: t("messages.hide_replies", { count: 1 }) }));
    expect(screen.queryByText("Sure, see you")).not.toBeInTheDocument();
  });

  it("replies to a message and reloads the list", async () => {
    const { requests } = mockFetch({
      "GET /api/messages": vi
        .fn()
        .mockReturnValueOnce([message({ unread: false })])
        .mockReturnValue([
          message({ unread: false }),
          message({ id: "reply-1", replyToId: "msg-1", body: "Thanks!", unread: false }),
        ]),
      "POST /api/messages": vi
        .fn()
        .mockReturnValueOnce(json({ error: "messages.error_unable_to_send_reply" }, 500))
        .mockReturnValueOnce({ ok: true }),
    });
    const { user } = renderMessages();

    await user.click(await screen.findByRole("button", { name: t("messages.reply") }));
    const send = screen.getByRole("button", { name: t("messages.send_reply") });
    await user.type(
      screen.getByRole("textbox", { name: t("messages.reply_to", { subject: "Planet Alpha" }) }),
      "On my way",
    );
    expect(send).toBeDisabled();
    await user.click(screen.getByRole("checkbox", { name: t("profile.message_mission_only_notice") }));
    await user.click(send);
    expect(await screen.findByText(t("messages.error_unable_to_send_reply"))).toBeInTheDocument();

    await user.click(send);
    await waitFor(() =>
      expect(screen.queryByRole("button", { name: t("messages.send_reply") })).not.toBeInTheDocument(),
    );
    expect(requests("POST", "/api/messages")[1].body).toEqual({ replyToId: "msg-1", message: "On my way" });
    expect(screen.getByRole("button", { name: t("messages.show_replies", { count: 1 }) })).toBeInTheDocument();
  });

  it("cancels a reply", async () => {
    mockFetch({ "GET /api/messages": [message({ unread: false })] });
    const { user } = renderMessages();

    await user.click(await screen.findByRole("button", { name: t("messages.reply") }));
    await user.click(screen.getByRole("button", { name: t("common.cancel") }));
    expect(screen.queryByRole("button", { name: t("messages.send_reply") })).not.toBeInTheDocument();
  });

  it("deletes a message after confirmation and reports failures", async () => {
    const { requests } = mockFetch({
      "GET /api/messages": vi
        .fn()
        .mockReturnValueOnce([message({ unread: false })])
        .mockReturnValue([]),
      "DELETE /api/messages": vi
        .fn()
        .mockReturnValueOnce(json({ error: "messages.error_unable_to_delete" }, 500))
        .mockReturnValueOnce({ ok: true }),
    });
    vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValue(true);
    const { user } = renderMessages();

    const remove = await screen.findByRole("button", { name: t("messages.delete_message") });
    await user.click(remove);
    expect(requests("DELETE", "/api/messages")).toHaveLength(0);

    await user.click(remove);
    expect(await screen.findByText(t("messages.error_unable_to_delete"))).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: t("messages.delete_message") }));
    expect(await screen.findByText(t("messages.no_messages"))).toBeInTheDocument();
    expect(requests("DELETE", "/api/messages")[1].body).toEqual({ messageId: "msg-1" });
  });

  it("lets the admin read every message and delete other people's messages", async () => {
    const { requests } = mockFetch({
      "GET /api/messages": [
        message({
          senderMemberId: "a",
          recipientMemberId: "b",
          senderName: "Alice",
          recipientName: "Bob",
          body: "Private chat",
          unread: false,
        }),
      ],
    });
    const { user } = renderMessages(admin);

    await waitFor(() =>
      expect(requests("GET", "/api/messages").some((call) => call.url.searchParams.get("scope") === "all")).toBe(true),
    );
    await user.click(await screen.findByRole("tab", { name: new RegExp(t("messages.tab_all")) }));
    const card = screen.getByText("Private chat").closest("article")!;
    expect(within(card).queryByRole("button", { name: t("messages.reply") })).not.toBeInTheDocument();
    expect(within(card).getByRole("button", { name: t("messages.delete_message") })).toBeInTheDocument();
  });
});
