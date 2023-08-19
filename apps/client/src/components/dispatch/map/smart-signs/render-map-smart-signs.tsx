import { SmartSignsMarker } from "./smart-sign-marker";
import { useSmartSigns } from "./use-smart-signs";

export function RenderMapSmartSigns() {
  const smartSigns = useSmartSigns();
  return smartSigns.map((marker) => <SmartSignsMarker key={marker.id} marker={marker} />);
}
