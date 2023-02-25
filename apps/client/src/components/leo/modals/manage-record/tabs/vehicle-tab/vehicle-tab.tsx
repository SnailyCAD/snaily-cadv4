import { AsyncListSearchField, Item, TextField, TabsContent } from "@snailycad/ui";
import { useFormikContext } from "formik";
import type { VehicleSearchResult } from "state/search/vehicle-search-state";
import { useTranslations } from "use-intl";

interface VehicleTabProps {
  isReadOnly?: boolean;
}

interface _FormikContext {
  plateOrVin?: string;
  plateOrVinSearch?: string;
  vehicleId?: string | null;
  vehicleModel?: string | null;
  vehicleColor?: string | null;
}

export function VehicleTab(props: VehicleTabProps) {
  const t = useTranslations();
  const { setValues, setFieldValue, errors, values } = useFormikContext<_FormikContext>();

  return (
    <TabsContent value="vehicle-tab">
      <h3 className="text-xl font-semibold mb-3">{t("Leo.vehicle")}</h3>

      <AsyncListSearchField<VehicleSearchResult>
        isDisabled={props.isReadOnly}
        allowsCustomValue
        autoFocus
        setValues={({ localValue, node }) => {
          const plateOrVinSearch =
            typeof localValue !== "undefined" ? { plateOrVinSearch: localValue } : {};
          const plateOrVin = node
            ? {
                plateOrVin: node.key as string,
                vehicleModel: node.value.model.value.value,
                vehicleColor: node.value.color,
                vehiclePlate: node.value.plate,
                vehicleId: node.value.id,
              }
            : {};

          setValues({ ...values, ...plateOrVinSearch, ...plateOrVin });
        }}
        localValue={values.plateOrVinSearch ?? ""}
        errorMessage={errors.plateOrVin}
        label={t("Leo.plateOrVin")}
        selectedKey={values.plateOrVin}
        fetchOptions={{
          apiPath: "/search/vehicle?includeMany=true",
          method: "POST",
          bodyKey: "plateOrVin",
          filterTextRequired: true,
        }}
      >
        {(item) => (
          <Item key={item.vinNumber} textValue={item.vinNumber}>
            {item.plate.toUpperCase()} ({item.vinNumber})
          </Item>
        )}
      </AsyncListSearchField>

      <TextField
        label={t("Vehicles.model")}
        value={values.vehicleModel ?? ""}
        isDisabled={props.isReadOnly}
        onChange={(value) => setFieldValue("vehicleModel", value)}
        errorMessage={errors.vehicleModel}
      />

      <TextField
        label={t("Vehicles.color")}
        value={values.vehicleColor ?? ""}
        isDisabled={props.isReadOnly}
        onChange={(value) => setFieldValue("vehicleColor", value)}
        errorMessage={errors.vehicleColor}
      />
    </TabsContent>
  );
}
