import { useState } from "react";
import { ShipMap } from "./components/ShipMap";
import { Sidebar } from "./components/Sidebar";
import { DetailPanel } from "./components/DetailPanel";
import { useFleetSimulation } from "./sim/useFleetSimulation";
import "./App.css";

const SHIPS_PER_LANE = 7;

function App() {
  const [timeScale, setTimeScale] = useState(12);
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [flyToToken, setFlyToToken] = useState(0);

  const { shipsRef, snapshots, simHour } = useFleetSimulation(SHIPS_PER_LANE, timeScale);
  const selectedShip = snapshots.find((s) => s.id === selectedShipId);

  function selectShip(id: string | null) {
    setSelectedShipId(id);
    if (id) setFlyToToken((t) => t + 1);
  }

  return (
    <div className="app">
      <Sidebar
        ships={snapshots}
        selectedShipId={selectedShipId}
        onSelectShip={selectShip}
        simHour={simHour}
        timeScale={timeScale}
        onTimeScaleChange={setTimeScale}
      />
      <main className="map-area">
        <ShipMap
          shipsRef={shipsRef}
          selectedShipId={selectedShipId}
          onSelectShip={selectShip}
          flyToToken={flyToToken}
        />
        <DetailPanel ship={selectedShip} onClose={() => selectShip(null)} />
      </main>
    </div>
  );
}

export default App;
