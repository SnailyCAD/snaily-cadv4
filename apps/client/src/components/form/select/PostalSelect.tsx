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

interface Props {
  addressLabel?: "address" | "location";
  postalOnly?: boolean;
}

export function AddressPostalSelect({ postalOnly, addressLabel = "address" }: Props) {
  const { values, errors, setValues, handleChange } = useFormikContext<{
    postal: string | null;
    address: string | null;
    location: string | null;
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
      [addressLabel]: suggestion.value.value,
    });
  }

  // todo: allow selecting preSuggestions

  return (
    <FormRow disabled={postalOnly} flexLike>
      {postalOnly ? null : (
        <FormField
          optional
          errorMessage={errors[addressLabel]}
          className="w-full"
          label={common(addressLabel)}
        >
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
              name: addressLabel,
              value: values[addressLabel] ?? "",
              errorMessage: errors[addressLabel],
              onChange: handleChange,
            }}
            options={{
              allowUnknown: true,
              method: "GET",
              dataKey: addressLabel,
              apiPath(inputValue) {
                return `/admin/values/address/search?query=${inputValue}`;
              },
            }}
          />
        </FormField>
      )}

      <FormField errorMessage={errors.postal} label={common("postal")} optional>
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
