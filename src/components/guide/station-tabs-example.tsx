"use client";

import { Tabs } from "@/components/layout/tabs";
import { useLocale } from "@/components/providers/locale-provider";

const noop = () => undefined;

export function StationTabsExample({ selectedKey = "all" }: Readonly<{ selectedKey?: string }>) {
  const { t } = useLocale();
  const items = [
    { key: "all", label: t("stations.filter_all"), count: 12, selected: true },
    { key: "mine", label: t("stations.my_stations"), count: 3, selected: false },
    { key: "pending", label: t("common.pending_status_label"), count: 5, selected: false },
    { key: "in_progress", label: t("stations.filter_in_mission"), count: 4, selected: false },
    { key: "my_missions", label: t("stations.filter_my_missions"), count: 2, selected: false },
    { key: "completed", label: t("stations.filter_mission_completed"), count: 3, selected: false },
  ].map((item) => ({ ...item, selected: item.key === selectedKey, onSelect: noop }));

  return (
    <div className="guide-example guide-tabs-example" inert>
      <div className="toolbar members-toolbar station-toolbar">
        <Tabs className="member-filter-tabs" items={items} label={t("stations.filter_stations_by_mission_status")} />
      </div>
    </div>
  );
}
