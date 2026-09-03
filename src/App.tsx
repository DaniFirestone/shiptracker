import { useMemo, useState } from "react";
import { ShipMap } from "./components/ShipMap";
import { Sidebar } from "./components/Sidebar";
import { DetailPanel } from "./components/DetailPanel";
import { useCruiseSimulation } from "./sim/useCruiseSimulation";
import { REGIONS, type CruiseRegion } from "./sim/cruiseData";
import "./App.css";

const INITIAL_TIME_SCALE = 48; // hours of sim time per real second (2 sim-days/sec)

function App() {
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [flyToToken, setFlyToToken] = useState(0);
  const [query, setQuery] = useState("");
  const [activeRegions, setActiveRegions] = useState<Set<CruiseRegion>>(new Set(REGIONS));

  const {
    shipsRef,
    currentMsRef,
    ships,
    currentMs,
    timeScale,
    setTimeScale,
    playing,
    setPlaying,
    seek,
  } = useCruiseSimulation(INITIAL_TIME_SCALE);
  const selectedShip = ships.find((s) => s.id === selectedShipId);

  const filteredShips = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ships
      .filter((s) => activeRegions.has(s.region))
      .filter((s) => !q || s.name.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [ships, query, activeRegions]);

  const visibleShipIds = useMemo(() => new Set(filteredShips.map((s) => s.id)), [filteredShips]);

  function toggleRegion(region: CruiseRegion) {
    setActiveRegions((prev) => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region);
      else next.add(region);
      return next;
    });
  }

  function selectShip(id: string | null) {
    setSelectedShipId(id);
    if (id) setFlyToToken((t) => t + 1);
  }

  return (
    <div className="app">
      <Sidebar
        ships={filteredShips}
        totalShipCount={ships.length}
        selectedShipId={selectedShipId}
        onSelectShip={selectShip}
        currentMs={currentMs}
        onSeek={seek}
        playing={playing}
        onTogglePlaying={() => setPlaying(!playing)}
        timeScale={timeScale}
        onTimeScaleChange={setTimeScale}
        query={query}
        onQueryChange={setQuery}
        activeRegions={activeRegions}
        onToggleRegion={toggleRegion}
      />
      <main className="map-area">
        <ShipMap
          shipsRef={shipsRef}
          currentMsRef={currentMsRef}
          visibleShipIds={visibleShipIds}
          selectedShipId={selectedShipId}
          onSelectShip={selectShip}
          flyToToken={flyToToken}
        />
        <DetailPanel ship={selectedShip} currentMs={currentMs} onClose={() => selectShip(null)} />
      </main>
    </div>
  );
}

export default App;
