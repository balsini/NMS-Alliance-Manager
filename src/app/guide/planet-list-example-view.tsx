"use client";

import { useState } from "react";
import {
  PlanetDestinationCard,
  type PlanetDestination,
} from "@/components/cards/planet-destination-card";
import { PlanetCard } from "@/components/modals/planet-card";

export function PlanetListExampleView({
  planet,
  planetData,
}: Readonly<{
  planet: PlanetDestination;
  planetData: Readonly<Record<string, unknown>>;
}>) {
  const [detailsOpen, setDetailsOpen] = useState(true);

  return (
    <div className="guide-example">
      <div className="guide-examples">
        <figure className="guide-example">
          <figcaption>Esempio di scheda pianeta</figcaption>
          <div className="planet-mission-list">
            <PlanetDestinationCard onOpen={() => undefined} planet={planet} />
          </div>
        </figure>
        <figure className="guide-example">
          <figcaption>Variante dimostrativa con ribbon Paradiso</figcaption>
          <div className="planet-mission-list">
            <PlanetDestinationCard
              onOpen={() => undefined}
              planet={{
                ...planet,
                id: `${planet.id}-paradise`,
                paradise: true,
              }}
            />
          </div>
        </figure>
        <figure className="guide-example">
          <figcaption>Variante dimostrativa con ribbon Dissonante</figcaption>
          <div className="planet-mission-list">
            <PlanetDestinationCard
              onOpen={() => undefined}
              planet={{
                ...planet,
                id: `${planet.id}-dissonant`,
                dissonant: true,
              }}
            />
          </div>
        </figure>
      </div>
      <h5>Scheda pianeta</h5>
      <p>La scheda di dettaglio che si apre selezionando un pianeta nella pagina Pianeti.</p>
      {detailsOpen && (
        <PlanetCard
          galaxy={planet.galaxy}
          initialPlanetPortal={planet.planetPortal}
          initialPlanetData={planetData}
          onClose={() => setDetailsOpen(false)}
          inlinePreview
          portal={planet.portal}
          title={planet.station?.name ?? planet.title ?? "Pianeta"}
        />
      )}
      {!detailsOpen && (
        <button className="primary-button" onClick={() => setDetailsOpen(true)} type="button">
          Mostra di nuovo la scheda pianeta
        </button>
      )}
    </div>
  );
}
