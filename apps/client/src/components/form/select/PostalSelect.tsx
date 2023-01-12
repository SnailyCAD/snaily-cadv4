import * as React from "react";
import { AddressValue, ValueType } from "@snailycad/types";
import { useValues } from "context/ValuesContext";
import { useFormikContext } from "formik";
import { useLoadValuesClientSide } from "hooks/useLoadValuesClientSide";
import { useTranslations } from "use-intl";
import { FormRow } from "../FormRow";
import { AsyncListSearchField, Item } from "@snailycad/ui";
import { classNames } from "lib/classNames";
import type { Node } from "@react-types/shared";

let hasFetched = false;

interface Props {
  /**
   * @default true
   */
  addressOptional?: boolean;
  /**
   * @default true
   */
  postalOptional?: boolean;
  addressLabel?: "address" | "location";
  postalOnly?: boolean;
  isDisabled?: boolean;
}

export function AddressPostalSelect(props: Props) {
  const addressLabel = props.addressLabel ?? "address";
  const { values, errors, setValues } = useFormikContext<{
    postal: string | null;
    address: string | null;
    location: string | null;
  }>();

  const [selectedAddress, setSelectedAddress] = React.useState<string | null>(null);
  const [selectedPostal, setSelectedPostal] = React.useState<string | null>(null);

  const common = useTranslations("Common");
  const { address } = useValues();
  useLoadValuesClientSide({
    enabled: !hasFetched,
    valueTypes: [ValueType.ADDRESS],
  });

  React.useEffect(() => {
    hasFetched = true;
  }, []);

  function handleSuggestionPress(_values: {
    type: "address" | "postal";
    node?: Node<AddressValue> | null;
    localValue?: string;
  }) {
    if (_values.type === "address") {
      setValues({
        ...values,
        [addressLabel]: _values.localValue ?? values[addressLabel],
        postal: _values.node?.value.postal ?? values.postal,
      });

      if (_values.node) {
        setSelectedAddress(_values.node.key as string);
        setSelectedPostal(_values.node.key as string);
      }
    } else {
      setValues({
        ...values,
        postal: _values.localValue ?? values.postal,
        [addressLabel]: _values.node?.value.value.value ?? values[addressLabel],
      });

      if (_values.node) {
        setSelectedPostal(_values.node.key as string);
        setSelectedAddress(_values.node.key as string);
      }
    }
  }

  return (
    <FormRow disabled={props.postalOnly} flexLike>
      {props.postalOnly ? null : (
        <AsyncListSearchField<AddressValue>
          isDisabled={props.isDisabled}
          selectedKey={selectedAddress}
          allowsCustomValue
          defaultItems={address.values}
          className="w-full"
          label={common(addressLabel)}
          isOptional={props.addressOptional}
          errorMessage={errors[addressLabel]}
          localValue={values[addressLabel] ?? ""}
          setValues={(values) => {
            handleSuggestionPress({ ...values, type: "address" });
          }}
          fetchOptions={{
            filterTextRequired: true,
            apiPath(inputValue) {
              return `/admin/values/address/search?query=${inputValue}`;
            },
          }}
        >
          {(item) => (
            <Item key={item.id} textValue={item.value.value}>
              <div className="flex flex-col items-start text-left">
                <p className="font-semibold">{item.value.value}</p>
                <p className="font-light text-base">
                  {item.postal} - {item.county}
                </p>
              </div>
            </Item>
          )}
        </AsyncListSearchField>
      )}

      <AsyncListSearchField<AddressValue>
        menuClassName="min-w-[350px] right-0"
        isDisabled={props.isDisabled}
        selectedKey={selectedPostal}
        allowsCustomValue
        defaultItems={address.values}
        className={classNames(!props.postalOnly && "w-[300px]")}
        label={common("postal")}
        isOptional={props.postalOptional}
        errorMessage={errors.postal}
        localValue={values.postal ?? ""}
        setValues={(values) => {
          handleSuggestionPress({ ...values, type: "postal" });
        }}
        fetchOptions={{
          filterTextRequired: true,
          apiPath(inputValue) {
            return `/admin/values/address/search?query=${inputValue}`;
          },
        }}
      >
        {(item) => (
          <Item key={item.id} textValue={item.postal || item.value.value}>
            <div className="flex flex-col items-start text-left">
              <p className="font-semibold">{item.postal}</p>
              <p className="font-light text-base">
                {item.value.value} - {item.county}
              </p>
            </div>
          </Item>
        )}
      </AsyncListSearchField>
    </FormRow>
  );
}
