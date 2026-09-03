import { useState } from "react";
import { ShipMap } from "./components/ShipMap";
import { Sidebar } from "./components/Sidebar";
import { DetailPanel } from "./components/DetailPanel";
import { useCruiseSimulation } from "./sim/useCruiseSimulation";
import "./App.css";

const INITIAL_TIME_SCALE = 48; // hours of sim time per real second (2 sim-days/sec)

function App() {
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [flyToToken, setFlyToToken] = useState(0);

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

  function selectShip(id: string | null) {
    setSelectedShipId(id);
    if (id) setFlyToToken((t) => t + 1);
  }

  return (
    <div className="app">
      <Sidebar
        ships={ships}
        selectedShipId={selectedShipId}
        onSelectShip={selectShip}
        currentMs={currentMs}
        onSeek={seek}
        playing={playing}
        onTogglePlaying={() => setPlaying(!playing)}
        timeScale={timeScale}
        onTimeScaleChange={setTimeScale}
      />
      <main className="map-area">
        <ShipMap
          shipsRef={shipsRef}
          currentMsRef={currentMsRef}
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
