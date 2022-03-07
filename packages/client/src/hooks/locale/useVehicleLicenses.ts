import * as React from "react";
import { VehicleTaxStatus, VehicleInspectionStatus } from "@snailycad/types";
import { useTranslations } from "next-intl";

export function useVehicleLicenses() {
  const t = useTranslations("Vehicles");

  const TAX_STATUS_LABELS = React.useMemo(
    () => ({
      [VehicleTaxStatus.TAXED]: t("taxed"),
      [VehicleTaxStatus.UNTAXED]: t("untaxed"),
    }),
    [t],
  );

  const TAX_STATUS = React.useMemo(() => {
    return Object.values(VehicleTaxStatus).map((v) => ({
      label: TAX_STATUS_LABELS[v],
      value: v,
    }));
  }, [TAX_STATUS_LABELS]);

  const INSPECTION_STATUS_LABELS = React.useMemo(
    () => ({
      [VehicleInspectionStatus.PASSED]: t("passed"),
      [VehicleInspectionStatus.FAILED]: t("failed"),
    }),
    [t],
  );

  const INSPECTION_STATUS = React.useMemo(() => {
    return Object.values(VehicleInspectionStatus).map((v) => ({
      label: INSPECTION_STATUS_LABELS[v],
      value: v,
    }));
  }, [INSPECTION_STATUS_LABELS]);

  return { TAX_STATUS, INSPECTION_STATUS, TAX_STATUS_LABELS, INSPECTION_STATUS_LABELS };
}
