import { useCallback, useMemo, useState } from "react";
import type { RankedStation } from "../types";
import { getWazeUrl, openExternalRoute } from "../utils/navigation";
import { formatDistance } from "../utils/distance";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type VoiceCommandOptions = {
  rankedStations: RankedStation[];
  selectedStation?: RankedStation;
  onSelectStation: (station: RankedStation) => void;
  onShowAvailable: () => void;
};

const getSpeechRecognition = () => {
  const speechWindow = window as Window &
    typeof globalThis & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
};

const speak = (message: string) => {
  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
};

export const useVoiceCommands = ({
  rankedStations,
  selectedStation,
  onSelectStation,
  onShowAvailable
}: VoiceCommandOptions) => {
  const [listening, setListening] = useState(false);
  const [lastCommand, setLastCommand] = useState("");
  const [lastResponse, setLastResponse] = useState("");

  const supported = useMemo(() => typeof window !== "undefined" && Boolean(getSpeechRecognition()), []);

  const respond = useCallback((message: string) => {
    setLastResponse(message);
    speak(message);
  }, []);

  const navigateToStation = useCallback(
    (station: RankedStation) => {
      onSelectStation(station);
      respond(`Opening Waze for ${station.name}.`);
      openExternalRoute(getWazeUrl(station));
    },
    [onSelectStation, respond]
  );

  const handleCommand = useCallback(
    (command: string) => {
      const normalized = command.toLowerCase().trim();
      setLastCommand(command);

      if (!rankedStations.length) {
        respond("No charging stations are loaded.");
        return;
      }

      const nearestAvailable = rankedStations.find((station) => station.availableSlots > 0) ?? rankedStations[0];

      if (normalized.includes("find nearest") || normalized.includes("nearest charging")) {
        onSelectStation(nearestAvailable);
        respond(
          `Nearest available station is ${nearestAvailable.name}, ${formatDistance(
            nearestAvailable.distanceKm
          )} away, ${nearestAvailable.availableSlots} slots open.`
        );
        return;
      }

      if (normalized.includes("show available")) {
        onShowAvailable();
        respond("Showing available chargers.");
        return;
      }

      if (normalized.includes("open waze")) {
        navigateToStation(selectedStation ?? nearestAvailable);
        return;
      }

      if (normalized.includes("navigate to")) {
        const requestedName = normalized.split("navigate to")[1]?.trim() ?? "";
        const station =
          rankedStations.find((candidate) => candidate.name.toLowerCase().includes(requestedName)) ??
          nearestAvailable;
        navigateToStation(station);
        return;
      }

      respond("Command not recognized.");
    },
    [navigateToStation, onSelectStation, onShowAvailable, rankedStations, respond, selectedStation]
  );

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();

    if (!SpeechRecognition) {
      respond("Voice mode is not supported on this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      respond("Voice command failed.");
    };
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? "";
      handleCommand(transcript);
    };

    recognition.start();
  }, [handleCommand, respond]);

  return {
    supported,
    listening,
    lastCommand,
    lastResponse,
    startListening
  };
};
