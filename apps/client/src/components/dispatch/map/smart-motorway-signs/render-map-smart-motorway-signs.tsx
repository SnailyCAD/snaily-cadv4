import { SmartMotorwaySignsMarker } from "./smart-motorway-sign-marker";
import { useSmartMotorwaySigns } from "./use-smart-motorway-signs";

export function RenderMapSmartMotorwaySigns() {
  const smartMotorwaySigns = useSmartMotorwaySigns();
  return smartMotorwaySigns?.map((marker, idx) => (
    <SmartMotorwaySignsMarker key={idx} marker={{ ...marker, id: idx }} />
  ));
}
