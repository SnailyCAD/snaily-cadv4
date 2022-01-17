import * as React from "react";
import { Button } from "components/Button";
import { FormikHelpers, useFormikContext } from "formik";
import { useTranslations } from "next-intl";
import { FormField } from "../FormField";
import { Input } from "./Input";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { CropImageModal } from "components/modal/CropImageModal";
import { AllowedFileExtension, allowedFileExtensions, IMGUR_REGEX } from "@snailycad/config";

interface Props {
  setImage: React.Dispatch<React.SetStateAction<(File | string) | null>>;
  image: (File | string) | null;
  label?: string;
  valueKey?: string;
}

export function ImageSelectInput({ label, valueKey = "image", image, setImage }: Props) {
  const [useURL, setUseURL] = React.useState(false);
  const { errors, values, setFieldValue, handleChange } = useFormikContext<any>();
  const common = useTranslations("Common");
  const { openModal, closeModal, isOpen } = useModal();

  function onCropSuccess(url: Blob, filename: string) {
    setImage(new File([url], filename, { type: url.type }));
    closeModal(ModalIds.CropImageModal);
  }

  function handleSetURL(v: boolean) {
    setUseURL(v);
    setImage(null);
    setFieldValue(valueKey, "");
  }

  return useURL ? (
    <FormField optional errorMessage={errors[valueKey] as string} label={label ?? common("image")}>
      <div className="flex gap-2">
        <Input
          placeholder="https://i.imgur.com/xxxxxx"
          onChange={(e) => {
            handleChange(e);
            setImage(e.target.value);
          }}
          name={valueKey}
          type="url"
          value={values[valueKey]}
        />

        <Button type="button" onClick={() => handleSetURL(false)}>
          {common("image")}
        </Button>
      </div>
    </FormField>
  ) : (
    <>
      <FormField
        optional
        errorMessage={errors[valueKey] as string}
        label={label ?? common("image")}
      >
        <div className="flex">
          <Input
            style={{ width: "95%", marginRight: "0.5em" }}
            onChange={(e) => {
              handleChange(e);
              setImage(e.target.files?.[0] ?? null);
            }}
            type="file"
            name={valueKey}
            value={values[valueKey] ?? ""}
          />
          <Button
            className="mr-2"
            type="button"
            onClick={() => {
              openModal(ModalIds.CropImageModal);
            }}
          >
            Crop
          </Button>
          <Button className="mr-2 min-w-fit" type="button" onClick={() => handleSetURL(true)}>
            {common("imgur")}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              setFieldValue(valueKey, "");
            }}
          >
            {common("delete")}
          </Button>
        </div>
      </FormField>

      {typeof image !== "string" ? (
        <CropImageModal
          isOpen={isOpen(ModalIds.CropImageModal)}
          onClose={() => closeModal(ModalIds.CropImageModal)}
          image={image}
          onSuccess={onCropSuccess}
        />
      ) : null}
    </>
  );
}

export function validateFile(image: File | string | null, helpers: FormikHelpers<any>) {
  if (typeof image === "string") {
    if (image.trim() === "") return null;

    if (!image.match(IMGUR_REGEX)) {
      throw helpers.setFieldError("image", "Image URL must match https://i.imgur.com/xxxxxx");
    }

    return image;
  }

  if (image?.size && image.name) {
    if (!allowedFileExtensions.includes(image.type as AllowedFileExtension)) {
      throw helpers.setFieldError(
        "image",
        `Only ${allowedFileExtensions.join(", ")} are supported`,
      );
    }

    return image;
  }

  return null;
}
