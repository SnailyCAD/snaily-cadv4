import * as React from "react";
import Link from "next/link";
import { Button } from "components/Button";
import { FormRow } from "components/form/FormRow";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { Select } from "components/form/Select";
import { ImageSelectInput, validateFile } from "components/form/inputs/ImageSelectInput";
import { CREATE_CITIZEN_SCHEMA } from "@snailycad/schemas";
import { useAuth } from "context/AuthContext";
import { useValues } from "context/ValuesContext";
import { handleValidate } from "lib/handleValidate";
import { Formik, FormikHelpers } from "formik";
import { Citizen } from "types/prisma";
import { useTranslations } from "next-intl";
import { Textarea } from "components/form/Textarea";

interface Props {
  citizen: Citizen | null;
  onSubmit(arg0: { data: any; formData?: FormData }): void | Promise<void>;
  state: "error" | "loading" | null;
}

export function ManageCitizenForm({ onSubmit, state, citizen }: Props) {
  const [image, setImage] = React.useState<File | string | null>(null);
  const { cad } = useAuth();
  const { gender, ethnicity } = useValues();
  const validate = handleValidate(CREATE_CITIZEN_SCHEMA);
  const t = useTranslations("Citizen");
  const common = useTranslations("Common");

  const weightPrefix = cad?.miscCadSettings?.weightPrefix
    ? `(${cad?.miscCadSettings.weightPrefix})`
    : "";

  const heightPrefix = cad?.miscCadSettings?.heightPrefix
    ? `(${cad?.miscCadSettings.heightPrefix})`
    : "";

  const INITIAL_VALUES = {
    name: citizen?.name ?? "",
    surname: citizen?.surname ?? "",
    dateOfBirth: citizen?.dateOfBirth ?? "",
    gender: citizen?.genderId ?? "",
    ethnicity: citizen?.ethnicityId ?? "",
    weight: citizen?.weight ?? "",
    height: citizen?.height ?? "",
    hairColor: citizen?.hairColor ?? "",
    eyeColor: citizen?.eyeColor ?? "",
    address: citizen?.address ?? "",
    image: undefined,
    phoneNumber: citizen?.phoneNumber ?? "",
    postal: citizen?.postal ?? "",
    occupation: citizen?.occupation ?? "",
  };

  async function handleSubmit(
    data: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    let fd;
    const validatedImage = validateFile(image, helpers);

    if (validatedImage) {
      if (typeof validatedImage === "object") {
        fd = new FormData();
        fd.set("image", validatedImage, validatedImage.name);
      }
    }

    return onSubmit({ data, formData: fd });
  }

  return (
    <Formik validate={validate} onSubmit={handleSubmit} initialValues={INITIAL_VALUES}>
      {({ handleSubmit, handleChange, values, errors, isValid }) => (
        <form onSubmit={handleSubmit}>
          <ImageSelectInput image={image} setImage={setImage} />

          <FormRow>
            <FormField errorMessage={errors.name} label={t("name")}>
              <Input value={values.name} onChange={handleChange} name="name" disabled />
            </FormField>

            <FormField errorMessage={errors.surname} label={t("surname")}>
              <Input value={values.surname} onChange={handleChange} name="surname" disabled />
            </FormField>
          </FormRow>

          <FormField errorMessage={errors.dateOfBirth as string} label={t("dateOfBirth")}>
            <Input
              type="date"
              value={new Date(values.dateOfBirth.toString()).toISOString().slice(0, 10)}
              onChange={(e) =>
                handleChange({
                  ...e,
                  target: { name: "dateOfBirth", value: e.target.valueAsDate },
                })
              }
              name="dateOfBirth"
            />
          </FormField>

          <FormRow>
            <FormField errorMessage={errors.gender} label={t("gender")}>
              <Select
                name="gender"
                value={values.gender}
                onChange={handleChange}
                values={gender.values.map((gender) => ({
                  label: gender.value,
                  value: gender.id,
                }))}
              />
            </FormField>

            <FormField errorMessage={errors.ethnicity} label={t("ethnicity")}>
              <Select
                name="ethnicity"
                value={values.ethnicity}
                onChange={handleChange}
                values={ethnicity.values.map((ethnicity) => ({
                  label: ethnicity.value,
                  value: ethnicity.id,
                }))}
              />
            </FormField>
          </FormRow>

          <FormRow>
            <FormField errorMessage={errors.hairColor} label={t("hairColor")}>
              <Input value={values.hairColor} onChange={handleChange} name="hairColor" />
            </FormField>

            <FormField errorMessage={errors.eyeColor} label={t("eyeColor")}>
              <Input value={values.eyeColor} onChange={handleChange} name="eyeColor" />
            </FormField>
          </FormRow>

          <FormRow>
            <FormField errorMessage={errors.weight} label={`${t("weight")} ${weightPrefix}`}>
              <Input value={values.weight} onChange={handleChange} name="weight" />
            </FormField>

            <FormField errorMessage={errors.height} label={`${t("height")} ${heightPrefix}`}>
              <Input value={values.height} onChange={handleChange} name="height" />
            </FormField>
          </FormRow>

          <FormRow flexLike>
            <FormField className="w-full" errorMessage={errors.address} label={t("address")}>
              <Input value={values.address} onChange={handleChange} name="address" />
            </FormField>

            <FormField optional errorMessage={errors.postal} label={common("postal")}>
              <Input
                className="min-w-[300px]"
                name="postal"
                onChange={handleChange}
                value={values.postal}
              />
            </FormField>
          </FormRow>

          <FormField optional errorMessage={errors.phoneNumber} label={t("phoneNumber")}>
            <Input value={values.phoneNumber ?? ""} onChange={handleChange} name="phoneNumber" />
          </FormField>

          <FormField optional errorMessage={errors.occupation} label={t("occupation")}>
            <Textarea name="occupation" onChange={handleChange} value={values.occupation} />
          </FormField>

          <div className="flex items-center justify-end">
            <Link href={citizen ? `/citizen/${citizen.id}` : "/citizen"}>
              <a className="mr-2 underline">{common("cancel")}</a>
            </Link>

            <Button
              className="flex items-center gap-2"
              type="submit"
              disabled={!isValid || state === "loading"}
            >
              {state === "loading" ? <Loader /> : null} {common("save")}
            </Button>
          </div>
        </form>
      )}
    </Formik>
  );
}
