import { AsyncListSearchField, Item } from "@snailycad/ui";
import { useFormikContext } from "formik";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useImageUrl } from "hooks/useImageUrl";
import Image from "next/image";
import type { NameSearchResult } from "state/search/name-search-state";

interface Props {
  label: string;
  autoFocus?: boolean;
  valueFieldName: string;
  labelFieldName: string;
  fromAuthUserOnly: boolean;
  /** @default `false` */
  allowsCustomValue?: boolean;
  isDisabled?: boolean;
  isOptional?: boolean;
  makeKey?(item: NameSearchResult): string;
}

export function CitizenSuggestionsField<Suggestion extends NameSearchResult>(props: Props) {
  const { setValues, errors, values } = useFormikContext<any>();
  const { SOCIAL_SECURITY_NUMBERS } = useFeatureEnabled();
  const { makeImageUrl } = useImageUrl();

  return (
    <AsyncListSearchField<Suggestion>
      autoFocus={props.autoFocus}
      className="w-full"
      isDisabled={props.isDisabled}
      isOptional={props.isOptional}
      allowsCustomValue={props.allowsCustomValue}
      setValues={({ localValue, node }) => {
        const labelValue =
          typeof localValue !== "undefined" ? { [props.labelFieldName]: localValue } : {};
        const valueField = node ? { [props.valueFieldName]: node.key as string } : {};

        setValues({ ...values, ...labelValue, ...valueField });
      }}
      localValue={values[props.labelFieldName]}
      errorMessage={errors[props.valueFieldName] as string}
      label={props.label}
      selectedKey={values[props.valueFieldName]}
      fetchOptions={{
        apiPath: `/search/name${props.fromAuthUserOnly ? "?fromAuthUserOnly=true" : ""}`,
        method: "POST",
        bodyKey: "name",
        filterTextRequired: true,
      }}
    >
      {(item) => {
        const name = `${item.name} ${item.surname}`;
        const key = props.makeKey ? props.makeKey(item) : item.id;

        return (
          <Item key={key} textValue={name}>
            <div className="flex items-center">
              {item.imageId ? (
                <Image
                  alt={`${item.name} ${item.surname}`}
                  className="rounded-md w-[30px] h-[30px] object-cover mr-2"
                  draggable={false}
                  src={makeImageUrl("citizens", item.imageId)!}
                  loading="lazy"
                  width={30}
                  height={30}
                />
              ) : null}
              <p>
                {name}{" "}
                {SOCIAL_SECURITY_NUMBERS && item.socialSecurityNumber ? (
                  <>(SSN: {item.socialSecurityNumber})</>
                ) : null}
              </p>
            </div>
          </Item>
        );
      }}
    </AsyncListSearchField>
  );
}
