import * as React from "react";
import { getSynthesisVoices } from "components/account/AppearanceTab";
import { useAuth } from "context/AuthContext";

interface SpeechAlertProps {
  isDisabled?: boolean;
  text: string;
  children: React.ReactNode;
}

export function SpeechAlert(props: SpeechAlertProps) {
  const speaked = React.useRef(false);

  const { user } = useAuth();

  const availableVoices = getSynthesisVoices() ?? [];
  const isSpeechEnabled = user?.soundSettings?.speech ?? true;
  const voiceURI = user?.soundSettings?.speechVoice;

  function handleSpeech() {
    try {
      const utterThis = new SpeechSynthesisUtterance(props.text);

      const availableVoice = availableVoices.find((voice) => voice.voiceURI === voiceURI);
      if (voiceURI && availableVoice) {
        utterThis.voice = availableVoice;
      }

      utterThis.rate = 0.9;

      window.speechSynthesis.speak(utterThis);
    } catch (e) {
      console.error("Failed to speak.");
    }
  }

  React.useEffect(() => {
    if (speaked.current || props.isDisabled || !isSpeechEnabled) {
      return;
    }

    handleSpeech();
    speaked.current = true;
  }, [props]); // eslint-disable-line react-hooks/exhaustive-deps

  return props.children as JSX.Element;
}
