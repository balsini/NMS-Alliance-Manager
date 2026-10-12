"use client";

import { Tabs } from "@/components/layout/tabs";

const noop = () => undefined;

export function MessageTabsExample() {
  const items = [
    {
      key: "received",
      label: "Ricevuti",
      count: 3,
      selected: true,
      onSelect: noop,
    },
    {
      key: "sent",
      label: "Inviati",
      count: 2,
      selected: false,
      onSelect: noop,
    },
  ];

  return (
    <div className="guide-example guide-message-tabs-example" inert>
      <div className="toolbar members-toolbar">
        <Tabs className="member-filter-tabs" items={items} label="Messaggi" />
      </div>
    </div>
  );
}
