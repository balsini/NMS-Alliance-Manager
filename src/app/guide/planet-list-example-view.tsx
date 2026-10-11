"use client";

import {
  PlanetDestinationCard,
  type PlanetDestination,
} from "@/components/cards/planet-destination-card";

export function PlanetListExampleView({
  planet,
}: Readonly<{ planet: PlanetDestination }>) {
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
    </div>
  );
}
