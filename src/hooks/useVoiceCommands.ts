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

type VoiceMessage = {
  id: string;
  role: "driver" | "assistant";
  text: string;
};

const getSpeechRecognition = () => {
  const speechWindow = window as Window &
    typeof globalThis & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
};

const speak = (message: string, onStart: () => void, onEnd: () => void) => {
  if (!("speechSynthesis" in window)) {
    onEnd();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(message);
  utterance.onstart = onStart;
  utterance.onend = onEnd;
  utterance.onerror = onEnd;
  window.speechSynthesis.speak(utterance);
};

export const useVoiceCommands = ({
  rankedStations,
  selectedStation,
  onSelectStation,
  onShowAvailable
}: VoiceCommandOptions) => {
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [lastCommand, setLastCommand] = useState("");
  const [lastResponse, setLastResponse] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);

  const supported = useMemo(() => typeof window !== "undefined" && Boolean(getSpeechRecognition()), []);

  const respond = useCallback((message: string) => {
    setLastResponse(message);
    setChatOpen(false);
    setSpeaking(true);
    speak(
      message,
      () => setSpeaking(true),
      () => {
        setSpeaking(false);
        setChatOpen(true);
        setMessages((currentMessages) => [
          ...currentMessages,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: message
          }
        ]);
      }
    );
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

      if (!normalized) {
        return;
      }

      setLastCommand(command);
      setTranscript(command);
      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: `driver-${Date.now()}`,
          role: "driver",
          text: command
        }
      ]);

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
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setListening(true);
      setTranscript("");
      setChatOpen(false);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      respond("Voice command failed.");
    };
    recognition.onresult = (event) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const phrase = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscript += phrase;
        } else {
          interimTranscript += phrase;
        }
      }

      setTranscript(finalTranscript || interimTranscript);

      if (finalTranscript) {
        handleCommand(finalTranscript);
      }
    };

    recognition.start();
  }, [handleCommand, respond]);

  return {
    supported,
    listening,
    speaking,
    transcript,
    lastCommand,
    lastResponse,
    chatOpen,
    messages,
    startListening
  };
};
