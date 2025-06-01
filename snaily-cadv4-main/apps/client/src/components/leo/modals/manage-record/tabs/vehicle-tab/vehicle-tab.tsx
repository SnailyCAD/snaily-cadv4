import { VehiclePaceType } from "@snailycad/types";
import {
  AsyncListSearchField,
  Item,
  TextField,
  TabsContent,
  FormRow,
  SelectField,
} from "@snailycad/ui";
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
  vehiclePaceType?: VehiclePaceType | null;
  vehicleSpeed?: string | null;
  speedLimit?: string | null;
}

export function VehicleTab(props: VehicleTabProps) {
  const t = useTranslations();
  const { setValues, setFieldValue, errors, values } = useFormikContext<_FormikContext>();

  const VEHICLE_PACE_TYPE_OPTIONS = Object.keys(VehiclePaceType).map((type) => ({
    value: type,
    label: t(`Leo.${type}`),
  }));

  return (
    <TabsContent value="vehicle-tab">
      <h3 className="text-xl font-semibold mb-3">{t("Leo.vehicle")}</h3>

      <AsyncListSearchField<VehicleSearchResult>
        isDisabled={props.isReadOnly}
        allowsCustomValue
        autoFocus
        onInputChange={(value) => setFieldValue("plateOrVinSearch", value)}
        onSelectionChange={(node) => {
          if (node?.value) {
            setValues({
              ...values,
              plateOrVinSearch: node.value?.plate ?? node.textValue,
              plateOrVin: node.key as string,
              vehicleModel: node.value.model.value.value,
              vehicleColor: node.value.color,
              vehicleId: node.value.id,
            });
          }
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

      <FormRow useFlex>
        <TextField
          label={t("Leo.speedLimit")}
          value={values.speedLimit ?? ""}
          isDisabled={props.isReadOnly}
          onChange={(value) => setFieldValue("speedLimit", value)}
          errorMessage={errors.speedLimit}
          className="w-full"
          isOptional
        />

        <TextField
          label={t("Leo.vehicleSpeed")}
          value={values.vehicleSpeed ?? ""}
          isDisabled={props.isReadOnly}
          onChange={(value) => setFieldValue("vehicleSpeed", value)}
          errorMessage={errors.vehicleSpeed}
          className="w-full"
          isOptional
        />

        <SelectField
          options={VEHICLE_PACE_TYPE_OPTIONS}
          label={t("Leo.vehiclePaceType")}
          selectedKey={values.vehiclePaceType}
          isDisabled={props.isReadOnly}
          onSelectionChange={(value) => setFieldValue("vehiclePaceType", value)}
          errorMessage={errors.vehiclePaceType}
          className="w-full"
          isOptional
        />
      </FormRow>
    </TabsContent>
  );
}
