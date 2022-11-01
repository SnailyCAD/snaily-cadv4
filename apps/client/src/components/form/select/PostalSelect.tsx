import * as React from "react";
import { AddressValue, ValueType } from "@snailycad/types";
import { useValues } from "context/ValuesContext";
import { useFormikContext } from "formik";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import { useTranslations } from "use-intl";
import { FormField } from "../FormField";
import { FormRow } from "../FormRow";
import { InputSuggestions } from "../inputs/InputSuggestions";

let hasFetched = false;

export function AddressPostalSelect() {
  const { values, errors, setValues, handleChange } = useFormikContext<{
    postal: string | null;
    address: string | null;
  }>();
  const common = useTranslations("Common");
  const { address } = useValues();
  useLoadValuesClientSide({
    enabled: !hasFetched,
    valueTypes: [ValueType.ADDRESS],
  });

  React.useEffect(() => {
    hasFetched = true;
  }, []);

  function handleSuggestionPress(suggestion: AddressValue) {
    setValues({
      ...values,
      postal: suggestion.postal,
      address: suggestion.value.value,
    });
  }

  // todo: allow selecting preSuggestions

  return (
    <FormRow flexLike>
      <FormField className="w-full" label={common("address")}>
        <InputSuggestions
          Component={({ suggestion }) => (
            <div className="flex flex-col items-start text-left">
              <p className="font-semibold">{suggestion.value.value}</p>
              <p className="font-light text-base">
                {suggestion.postal} - {suggestion.county}
              </p>
            </div>
          )}
          onSuggestionPress={handleSuggestionPress}
          preSuggestions={address.values}
          inputProps={{
            name: "address",
            value: values.address ?? "",
            errorMessage: errors.address,
            onChange: handleChange,
          }}
          options={{
            allowUnknown: true,
            method: "GET",
            dataKey: "address",
            apiPath(inputValue) {
              return `/admin/values/address/search?query=${inputValue}`;
            },
          }}
        />
      </FormField>

      <FormField label={common("postal")}>
        <InputSuggestions
          className="w-[300px]"
          onSuggestionPress={handleSuggestionPress}
          Component={({ suggestion }) => (
            <div className="flex flex-col items-start text-left">
              <p className="font-semibold">{suggestion.postal}</p>
              <p className="font-light text-base">
                {suggestion.value.value} - {suggestion.county}
              </p>
            </div>
          )}
          preSuggestions={address.values}
          inputProps={{
            name: "postal",
            value: values.postal ?? "",
            errorMessage: errors.postal,
            onChange: handleChange,
          }}
          options={{
            allowUnknown: true,
            method: "GET",
            dataKey: "postal",
            apiPath(inputValue) {
              return `/admin/values/address/search?query=${inputValue}`;
            },
          }}
        />
      </FormField>
    </FormRow>
  );
}
