"use client";

import { Tabs } from "@/components/layout/tabs";
import { useLocale } from "@/components/providers/locale-provider";

const noop = () => undefined;

export function MissionTabsExample() {
  const { t } = useLocale();
  const items = [
    { key: "all", label: t("common.all"), count: 9, selected: true },
    { key: "in_progress", label: t("missions.status_in_progress"), count: 3, selected: false },
    { key: "pending_assigned", label: t("missions.pending_assigned"), count: 2, selected: false },
    { key: "pending_unassigned", label: t("missions.pending_unassigned"), count: 2, selected: false },
    { key: "completed", label: t("missions.status_completed"), count: 2, selected: false },
  ].map((item) => ({ ...item, onSelect: noop }));

  return (
    <div className="guide-example guide-tabs-example" inert>
      <div className="toolbar">
        <Tabs items={items} label={t("common.filter_by_status")} />
      </div>
    </div>
  );
}
