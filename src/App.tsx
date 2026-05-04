import { useEffect, useMemo, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import QRCode from "qrcode";
import {
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Gauge,
  List,
  LocateFixed,
  Map as MapIcon,
  MapPin,
  Mic,
  Navigation,
  PlugZap,
  QrCode,
  Route,
  Satellite,
  Volume2,
  Zap
} from "lucide-react";
import { DEMO_CENTER, stations } from "./data/stations";
import { useDemoMode } from "./hooks/useDemoMode";
import { useStationTelemetry } from "./hooks/useStationTelemetry";
import { useUserLocation } from "./hooks/useUserLocation";
import { useVoiceCommands } from "./hooks/useVoiceCommands";
import type { CommunityReport, Coordinates, RankedStation, ReportAction, Station } from "./types";
import { isValidCoordinates, withFallbackCoordinates } from "./utils/coordinates";
import { formatDistance } from "./utils/distance";
import { formatPeso, formatUpdatedAt } from "./utils/format";
import { getGoogleMapsUrl, getWazeUrl } from "./utils/navigation";
import { applyStatusOverlays, rankStations } from "./utils/ranking";

type ViewMode = "list" | "map";

const reportLabels: Record<ReportAction, string> = {
  charging: "I'm charging",
  left: "I just left",
  full: "Reported full",
  available: "Reported available"
};

const getInitialDemoMode = () => {
  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("demo") === "1";
};

const createStationIcon = (station: Station, selected: boolean) =>
  L.divIcon({
    className: "",
    html: `<div class="station-marker${selected ? " station-marker--selected" : ""}${
      station.availableSlots === 0 ? " station-marker--full" : ""
    }"><span>${station.availableSlots}</span></div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -18]
  });

const userIcon = L.divIcon({
  className: "",
  html: '<div class="user-marker"><span></span></div>',
  iconSize: [28, 28],
  iconAnchor: [14, 14]
});

const focusMapOn = (map: L.Map, station: RankedStation | undefined, coords: Coordinates) => {
  const hasValidStation = station && isValidCoordinates(station);
  const focus = hasValidStation ? station : coords;

  if (!isValidCoordinates(focus)) {
    return;
  }

  const container = map.getContainer();

  if (container.clientWidth === 0 || container.clientHeight === 0) {
    return;
  }

  map.invalidateSize();
  map.setView([focus.lat, focus.lng], hasValidStation ? 14 : 13, {
    animate: false
  });
};

function MapFocus({
  selectedStation,
  coords
}: {
  selectedStation?: RankedStation;
  coords: Coordinates;
}) {
  const map = useMap();

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      focusMapOn(map, selectedStation, coords);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [coords, map, selectedStation]);

  return null;
}

function StationMap({
  stations,
  selectedStation,
  userCoords,
  onSelectStation
}: {
  stations: RankedStation[];
  selectedStation?: RankedStation;
  userCoords: Coordinates;
  onSelectStation: (station: RankedStation) => void;
}) {
  const safeUserCoords = withFallbackCoordinates(userCoords, DEMO_CENTER);
  const markerStations = stations.filter(isValidCoordinates);

  return (
    <MapContainer
      className="station-map"
      center={[safeUserCoords.lat, safeUserCoords.lng]}
      zoom={13}
      scrollWheelZoom
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[safeUserCoords.lat, safeUserCoords.lng]} icon={userIcon}>
        <Popup>Your location</Popup>
      </Marker>
      {markerStations.map((station) => (
        <Marker
          key={station.id}
          position={[station.lat, station.lng]}
          icon={createStationIcon(station, selectedStation?.id === station.id)}
          eventHandlers={{
            click: () => onSelectStation(station)
          }}
        >
          <Popup>
            <strong>{station.name}</strong>
            <br />
            {station.availableSlots}/{station.totalSlots} slots open
          </Popup>
        </Marker>
      ))}
      <MapFocus selectedStation={selectedStation} coords={safeUserCoords} />
    </MapContainer>
  );
}

function ViewSwitch({
  view,
  setView
}: {
  view: ViewMode;
  setView: (view: ViewMode) => void;
}) {
  return (
    <div className="segmented-control" aria-label="View mode">
      <button type="button" className={view === "list" ? "active" : ""} onClick={() => setView("list")}>
        <List size={16} />
        List
      </button>
      <button type="button" className={view === "map" ? "active" : ""} onClick={() => setView("map")}>
        <MapIcon size={16} />
        Map
      </button>
    </div>
  );
}

function AvailabilityBadge({ station }: { station: Station }) {
  if (station.availableSlots === 0) {
    return (
      <span className="status-badge status-badge--full">
        <AlertTriangle size={14} />
        Full
      </span>
    );
  }

  return (
    <span className="status-badge">
      <CheckCircle2 size={14} />
      {station.availableSlots} open
    </span>
  );
}

function StationCard({
  station,
  selected,
  onSelect
}: {
  station: RankedStation;
  selected: boolean;
  onSelect: () => void;
}) {
  const wazeUrl = getWazeUrl(station);
  const googleMapsUrl = getGoogleMapsUrl(station);

  return (
    <article
      className={`station-card${selected ? " station-card--selected" : ""}`}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onSelect();
        }
      }}
    >
      <div className="station-card__top">
        <div>
          <span className="rank-label">{station.rankLabel}</span>
          <h3>{station.name}</h3>
        </div>
        <AvailabilityBadge station={station} />
      </div>

      <p className="station-area">
        <MapPin size={15} />
        {station.district}
      </p>

      <div className="metric-row">
        <span>
          <PlugZap size={15} />
          {station.availableSlots}/{station.totalSlots} slots
        </span>
        <span>
          <Route size={15} />
          {formatDistance(station.distanceKm)}
        </span>
        <span>
          <Gauge size={15} />
          {formatPeso(station.costPerKwh)}
        </span>
      </div>

      <div className="connector-row" aria-label="Connector types">
        {station.connectorTypes.map((connector) => (
          <span key={connector}>{connector}</span>
        ))}
      </div>

      <div className="station-card__footer">
        <span>
          <Clock3 size={14} />
          {station.statusSource}: {formatUpdatedAt(station.updatedAt)}
        </span>
        <div className="nav-actions">
          <a href={wazeUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
            <Navigation size={15} />
            Open Waze
          </a>
          <a href={googleMapsUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
            <ExternalLink size={15} />
            Google Maps
          </a>
        </div>
      </div>
    </article>
  );
}

function DetailPane({
  station,
  qrCode,
  shareUrl,
  voice,
  reports,
  onReport
}: {
  station?: RankedStation;
  qrCode: string;
  shareUrl: string;
  voice: {
    supported: boolean;
    listening: boolean;
    speaking: boolean;
    transcript: string;
    lastCommand: string;
    lastResponse: string;
    chatOpen: boolean;
    messages: Array<{
      id: string;
      role: "driver" | "assistant";
      text: string;
    }>;
    startListening: () => void;
  };
  reports: CommunityReport[];
  onReport: (stationId: string, action: ReportAction) => void;
}) {
  if (!station) {
    return (
      <aside className="detail-pane detail-pane--empty">
        <PlugZap size={24} />
        <p>No stations loaded</p>
      </aside>
    );
  }

  const occupiedSlots = station.totalSlots - station.availableSlots;
  const occupancy = Math.round((occupiedSlots / station.totalSlots) * 100);
  const wazeUrl = getWazeUrl(station);
  const googleMapsUrl = getGoogleMapsUrl(station);

  return (
    <aside className="detail-pane">
      <section className="detail-header">
        <span className="rank-label">{station.rankLabel}</span>
        <h2>{station.name}</h2>
        <p>
          <MapPin size={15} />
          {station.district} · {formatDistance(station.distanceKm)}
        </p>
      </section>

      <section className="detail-stats">
        <div>
          <strong>{station.availableSlots}</strong>
          <span>open slots</span>
        </div>
        <div>
          <strong>{station.totalSlots}</strong>
          <span>total slots</span>
        </div>
        <div>
          <strong>{formatPeso(station.costPerKwh).replace("/kWh", "")}</strong>
          <span>per kWh</span>
        </div>
      </section>

      <section className="occupancy-block" aria-label="Occupancy">
        <div className="occupancy-block__label">
          <span>{occupancy}% occupied</span>
          <span>{station.statusSource}</span>
        </div>
        <div className="occupancy-track">
          <span style={{ width: `${occupancy}%` }} />
        </div>
        <p>
          <Clock3 size={14} />
          Updated {formatUpdatedAt(station.updatedAt)}
        </p>
      </section>

      <section className="nav-stack">
        <a className="primary-action" href={wazeUrl} target="_blank" rel="noreferrer">
          <Navigation size={18} />
          Open Waze
        </a>
        <a className="secondary-action" href={googleMapsUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={18} />
          Google Maps
        </a>
      </section>

      <section className="report-grid" aria-label="Crowd report actions">
        <button type="button" onClick={() => onReport(station.id, "charging")}>
          <BatteryCharging size={17} />
          I'm charging
        </button>
        <button type="button" onClick={() => onReport(station.id, "left")}>
          <Zap size={17} />
          I just left
        </button>
        <button type="button" onClick={() => onReport(station.id, "full")}>
          <AlertTriangle size={17} />
          Report full
        </button>
        <button type="button" onClick={() => onReport(station.id, "available")}>
          <CheckCircle2 size={17} />
          Report available
        </button>
      </section>

      <section className="report-log" aria-label="Community report log">
        <div className="panel-title">
          <List size={16} />
          <span>Community reports</span>
        </div>
        {reports.length > 0 ? (
          <div className="report-log__items">
            {reports.map((report) => (
              <div key={report.id} className="report-log__item">
                <span>{report.label}</span>
                <time>{formatUpdatedAt(report.createdAt)}</time>
              </div>
            ))}
          </div>
        ) : (
          <p>No reports yet</p>
        )}
      </section>

      <section className="voice-panel">
        <div className="panel-title">
          <Volume2 size={16} />
          <span>Voice mode</span>
        </div>
        <button type="button" className="secondary-action" onClick={voice.startListening} disabled={!voice.supported}>
          <Mic size={18} />
          {voice.listening ? "Listening" : voice.supported ? "Start voice" : "Unsupported"}
        </button>
        {(voice.listening || voice.transcript) && (
          <p className="live-transcript">
            <span>{voice.listening ? "Listening" : "Heard"}</span>
            {voice.transcript || "..."}
          </p>
        )}
        {(voice.speaking || voice.lastCommand || voice.lastResponse) && (
          <p className="voice-result">
            {voice.lastCommand && <span>Heard: {voice.lastCommand}</span>}
            {voice.lastResponse && <span>{voice.speaking ? "Speaking: " : ""}{voice.lastResponse}</span>}
          </p>
        )}
        {voice.chatOpen && voice.messages.length > 0 && (
          <div className="voice-chat" aria-label="Voice chat transcript">
            {voice.messages.slice(-4).map((message) => (
              <div key={message.id} className={`voice-chat__bubble voice-chat__bubble--${message.role}`}>
                {message.text}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="qr-panel">
        <div className="panel-title">
          <QrCode size={16} />
          <span>Demo QR</span>
        </div>
        {qrCode && <img src={qrCode} alt="QR code for demo mode" />}
        <p>{shareUrl}</p>
      </section>
    </aside>
  );
}

export default function App() {
  const [demoMode, setDemoMode] = useState(getInitialDemoMode);
  const [view, setView] = useState<ViewMode>("list");
  const [isDesktopLayout, setIsDesktopLayout] = useState(() =>
    typeof window === "undefined" ? true : window.matchMedia("(min-width: 980px)").matches
  );
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(stations[0]?.id ?? "");
  const [communityReports, setCommunityReports] = useState<CommunityReport[]>([]);
  const [qrCode, setQrCode] = useState("");
  const [shareUrl, setShareUrl] = useState("");

  const demo = useDemoMode(demoMode);
  const telemetryOverlays = useStationTelemetry(stations);
  const location = useUserLocation(demoMode, demo.coords);
  const safeUserCoords = useMemo(
    () => withFallbackCoordinates(location.coords, DEMO_CENTER),
    [location.coords]
  );
  const shouldRenderList = isDesktopLayout || view === "list";
  const shouldRenderMap = isDesktopLayout || view === "map";

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 980px)");
    const handleChange = () => setIsDesktopLayout(mediaQuery.matches);

    handleChange();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    const legacyMediaQuery = mediaQuery as MediaQueryList & {
      addListener?: (listener: () => void) => void;
      removeListener?: (listener: () => void) => void;
    };

    legacyMediaQuery.addListener?.(handleChange);
    return () => legacyMediaQuery.removeListener?.(handleChange);
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);

    if (demoMode) {
      url.searchParams.set("demo", "1");
    } else {
      url.searchParams.delete("demo");
    }

    window.history.replaceState(null, "", url);
  }, [demoMode]);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("demo", "1");
    url.hash = "";
    const nextShareUrl = url.toString();
    setShareUrl(nextShareUrl);

    QRCode.toDataURL(nextShareUrl, {
      width: 176,
      margin: 1,
      color: {
        dark: "#0f172a",
        light: "#ffffff"
      }
    }).then(setQrCode);
  }, [demoMode]);

  const effectiveStations = useMemo(
    () => applyStatusOverlays(stations, { ...telemetryOverlays, ...demo.overlays }),
    [demo.overlays, telemetryOverlays]
  );

  const rankedStations = useMemo(
    () => rankStations(effectiveStations, safeUserCoords),
    [effectiveStations, safeUserCoords]
  );

  const visibleStations = useMemo(
    () => (availableOnly ? rankedStations.filter((station) => station.availableSlots > 0) : rankedStations),
    [availableOnly, rankedStations]
  );

  const selectedStation = useMemo(
    () => rankedStations.find((station) => station.id === selectedId) ?? rankedStations[0],
    [rankedStations, selectedId]
  );

  const selectedReports = useMemo(
    () =>
      communityReports
        .filter((report) => report.stationId === selectedStation?.id)
        .slice(0, 5),
    [communityReports, selectedStation?.id]
  );

  const availableStationCount = rankedStations.filter((station) => station.availableSlots > 0).length;
  const openSlotCount = rankedStations.reduce((total, station) => total + station.availableSlots, 0);

  const selectStation = (station: RankedStation) => {
    setSelectedId(station.id);
  };

  const reportStation = (stationId: string, action: ReportAction) => {
    const station = effectiveStations.find((candidate) => candidate.id === stationId);

    if (!station) {
      return;
    }

    const createdAt = new Date().toISOString();

    setCommunityReports((currentReports) => [
      {
        id: `${stationId}-${createdAt}`,
        stationId,
        stationName: station.name,
        action,
        label: reportLabels[action],
        createdAt
      },
      ...currentReports
    ]);
  };

  const voice = useVoiceCommands({
    rankedStations,
    selectedStation,
    onSelectStation: (station) => {
      selectStation(station);
      setView("list");
    },
    onShowAvailable: () => {
      setAvailableOnly(true);
      setView("list");
    }
  });

  return (
    <div className="app-shell">
      <header className="top-bar">
        <div className="brand-lockup">
          <div className="brand-mark" aria-hidden="true">
            <PlugZap size={24} />
          </div>
          <div>
            <h1>EV Slot Mapper</h1>
            <span>Telemetry slots with community reports</span>
          </div>
        </div>

        <div className="top-actions">
          <button
            type="button"
            className={`icon-action${demoMode ? " icon-action--active" : ""}`}
            onClick={() => setDemoMode((enabled) => !enabled)}
            title="Toggle demo mode"
            aria-label="Toggle demo mode"
          >
            <Satellite size={19} />
          </button>
          <button
            type="button"
            className={`icon-action${voice.listening ? " icon-action--active" : ""}`}
            onClick={voice.startListening}
            title="Start voice mode"
            aria-label="Start voice mode"
            disabled={!voice.supported}
          >
            <Mic size={19} />
          </button>
        </div>
      </header>

      <div className="mobile-view-switch">
        <ViewSwitch view={view} setView={setView} />
      </div>

      <main className="workspace" data-view={view}>
        {shouldRenderList && (
          <section className="list-pane" aria-label="Ranked charging stations">
            <div className="location-strip">
              <span>
                <LocateFixed size={16} />
                {location.message}
              </span>
              {safeUserCoords.accuracy && <span>+/- {Math.round(safeUserCoords.accuracy)} m</span>}
            </div>

            <div className="summary-strip">
              <div>
                <strong>{availableStationCount}</strong>
                <span>available</span>
              </div>
              <div>
                <strong>{openSlotCount}</strong>
                <span>open slots</span>
              </div>
              <div>
                <strong>{rankedStations.length}</strong>
                <span>stations</span>
              </div>
            </div>

            <div className="filter-row">
              <button
                type="button"
                className={!availableOnly ? "active" : ""}
                onClick={() => setAvailableOnly(false)}
              >
                All
              </button>
              <button
                type="button"
                className={availableOnly ? "active" : ""}
                onClick={() => setAvailableOnly(true)}
              >
                Available
              </button>
              <button
                type="button"
                className={demoMode ? "active" : ""}
                onClick={() => setDemoMode((enabled) => !enabled)}
              >
                Demo
              </button>
            </div>

            <div className="station-feed">
              {visibleStations.map((station) => (
                <StationCard
                  key={station.id}
                  station={station}
                  selected={selectedStation?.id === station.id}
                  onSelect={() => selectStation(station)}
                />
              ))}
            </div>
          </section>
        )}

        {shouldRenderMap && (
          <section className="map-pane" aria-label="Charging station map">
            <StationMap
              stations={visibleStations}
              selectedStation={selectedStation}
              userCoords={safeUserCoords}
              onSelectStation={selectStation}
            />
          </section>
        )}

        <DetailPane
          station={selectedStation}
          qrCode={qrCode}
          shareUrl={shareUrl}
          voice={voice}
          reports={selectedReports}
          onReport={reportStation}
        />
      </main>
    </div>
  );
}
