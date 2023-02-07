import * as React from "react";
import { Input, Button } from "@snailycad/ui";
import { FormikHelpers, useFormikContext } from "formik";
import { useTranslations } from "next-intl";
import { FormField } from "../FormField";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { CropImageModal } from "components/modal/CropImageModal";
import { AllowedFileExtension, allowedFileExtensions, IMAGES_REGEX } from "@snailycad/config";
import Link from "next/link";
import { BoxArrowUpRight } from "react-bootstrap-icons";
import { useDebounce } from "react-use";

interface Props {
  setImage: React.Dispatch<React.SetStateAction<(File | string) | null>>;
  image: (File | string) | null;
  label?: string;
  valueKey?: string;
  hideLabel?: boolean;
}

export function ImageSelectInput({ label, hideLabel, valueKey = "image", image, setImage }: Props) {
  const [useURL, setUseURL] = React.useState(false);
  const [urlImageData, setURLImageData] = React.useState<File | null>(null);

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

  useDebounce(fetchImageData, 500, [values[valueKey]]);
  async function fetchImageData() {
    try {
      const url = values[valueKey];

      if (!url) return;
      if (!IMAGES_REGEX.test(url)) return;

      const res = await fetch(url).catch(() => null);
      if (!res?.ok) return;
      const blob = await res.blob();

      setURLImageData(new File([blob], "image", { type: blob.type }));
    } catch (error) {
      console.error(error);
    }
  }

  return useURL ? (
    <FormField
      optional
      errorMessage={errors[valueKey] as string}
      label={hideLabel ? null : label ?? common("image")}
    >
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

        <Button
          className="min-w-fit"
          disabled={!urlImageData}
          type="button"
          onPress={() => {
            openModal(ModalIds.CropImageModal);
          }}
        >
          {common("crop")}
        </Button>
        <Button type="button" onPress={() => handleSetURL(false)}>
          {common("image")}
        </Button>
      </div>

      <Link
        className="mt-1 underline flex items-center gap-1 text-neutral-700 dark:text-gray-400"
        target="_blank"
        href="https://docs.snailycad.org/docs/features/general/supported-images"
      >
        {common("supportedImages")}
        <BoxArrowUpRight className="inline-block" />
      </Link>

      <CropImageModal
        isOpen={isOpen(ModalIds.CropImageModal)}
        onClose={() => closeModal(ModalIds.CropImageModal)}
        image={urlImageData}
        onSuccess={onCropSuccess}
      />
    </FormField>
  ) : (
    <>
      <FormField
        optional
        errorMessage={errors[valueKey] as string}
        label={hideLabel ? null : label ?? common("image")}
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
            value={typeof values[valueKey] === "string" ? undefined : values[valueKey]}
          />
          <Button
            className="mr-2 min-w-fit"
            type="button"
            onPress={() => {
              openModal(ModalIds.CropImageModal);
            }}
          >
            {common("crop")}
          </Button>
          <Button className="mr-2 min-w-fit" type="button" onPress={() => handleSetURL(true)}>
            {common("url")}
          </Button>
          <Button
            className="min-w-fit"
            type="button"
            variant="danger"
            onPress={() => {
              setFieldValue(valueKey, null);
              setImage(null);
            }}
          >
            {common("delete")}
          </Button>
        </div>

        <Link
          className="mt-1 underline flex items-center gap-1 text-neutral-700 dark:text-gray-400"
          target="_blank"
          href="https://docs.snailycad.org/docs/features/general/supported-images"
        >
          {common("supportedImages")}
          <BoxArrowUpRight className="inline-block" />
        </Link>
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

    if (!image.match(IMAGES_REGEX)) {
      throw helpers.setFieldError(
        "image",
        "Image URL must match https://i.imgur.com/xxxxxx or https://cdn.discordapp.com/attachments/xxxxxx/xxxxxx",
      );
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
