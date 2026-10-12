"use client";

import { useState } from "react";
import {
  PlanetActiveFilters,
  PlanetFilters,
  emptyPlanetFilterOptions,
  emptyPlanetFilterValues,
  hasActivePlanetFilters,
  type PlanetFilterValues,
} from "@/components/forms/planet-filters";

export function PlanetFiltersExample({
  initiallyOpen = false,
  initialFilters = emptyPlanetFilterValues,
}: Readonly<{ initiallyOpen?: boolean; initialFilters?: PlanetFilterValues }>) {
  const [open, setOpen] = useState(initiallyOpen);
  const [filters, setFilters] = useState(initialFilters);
  const updateFilter = <K extends keyof PlanetFilterValues>(key: K, value: PlanetFilterValues[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };
  const hasActiveFilters = hasActivePlanetFilters(filters);
  const resetFilters = () => setFilters(emptyPlanetFilterValues);

  return (
    <div className="guide-example">
      <PlanetFilters
        hasActiveFilters={hasActiveFilters}
        onChange={updateFilter}
        onSearchChange={() => undefined}
        onToggle={() => setOpen((current) => !current)}
        open={open}
        options={emptyPlanetFilterOptions}
        search=""
        values={filters}
      />
      <PlanetActiveFilters onChange={updateFilter} onReset={resetFilters} values={filters} />
    </div>
  );
}
