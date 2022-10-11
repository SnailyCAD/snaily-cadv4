import { InputSuggestions } from "components/form/inputs/InputSuggestions";
import { useFormikContext } from "formik";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { useImageUrl } from "hooks/useImageUrl";
import Image from "next/future/image";
import type { NameSearchResult } from "state/search/nameSearchState";

interface Props {
  valueFieldName: string;
  labelFieldName: string;
  fromAuthUserOnly: boolean;
  /** @default `false` */
  allowUnknown?: boolean;
  isDisabled?: boolean;
}

export function CitizenSuggestionsField<Suggestion extends NameSearchResult>({
  labelFieldName,
  valueFieldName,
  fromAuthUserOnly,
  allowUnknown = false,
  isDisabled = false,
}: Props) {
  const { setValues, handleChange, errors, values } = useFormikContext<any>();
  const { SOCIAL_SECURITY_NUMBERS } = useFeatureEnabled();
  const { makeImageUrl } = useImageUrl();

  return (
    <InputSuggestions<Suggestion>
      onSuggestionPress={(suggestion) => {
        setValues({
          ...values,
          [valueFieldName]: suggestion.id,
          [labelFieldName]: `${suggestion.name} ${suggestion.surname}`,
        });
      }}
      Component={({ suggestion }) => (
        <div className="flex items-center">
          {suggestion.imageId ? (
            <Image
              className="rounded-md w-[30px] h-[30px] object-cover mr-2"
              draggable={false}
              src={makeImageUrl("citizens", suggestion.imageId)!}
              loading="lazy"
              width={30}
              height={30}
              alt={`${suggestion.name} ${suggestion.surname}`}
            />
          ) : null}
          <p>
            {suggestion.name} {suggestion.surname}{" "}
            {SOCIAL_SECURITY_NUMBERS && suggestion.socialSecurityNumber ? (
              <>(SSN: {suggestion.socialSecurityNumber})</>
            ) : null}
          </p>
        </div>
      )}
      options={{
        apiPath: `/search/name${fromAuthUserOnly ? "?fromAuthUserOnly=true" : ""}`,
        method: "POST",
        dataKey: "name",
        allowUnknown,
      }}
      inputProps={{
        value: values[labelFieldName],
        name: labelFieldName,
        onChange: handleChange,
        errorMessage: errors[valueFieldName] as string,
        disabled: isDisabled,
      }}
    />
  );
}
