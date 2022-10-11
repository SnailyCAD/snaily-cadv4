import * as React from "react";
import Cropper from "react-cropper";
import type CropperJS from "cropperjs";
import { Button } from "@snailycad/ui";
import { useTranslations } from "use-intl";
import { Modal } from "./Modal";
import "cropperjs/dist/cropper.css";

interface Props {
  onSuccess(url: Blob, filename: string): void;
  onClose(): void;
  isOpen: boolean;
  image: File | null;
  options?: { width?: number; height?: number; aspectRatio: number };
}

export function CropImageModal({ onSuccess, image, isOpen = false, onClose, options }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations("Errors");

  const [src, setSrc] = React.useState<string | null>(null);
  const [cropper, setCropper] = React.useState<CropperJS>();
  const width = !src ? 450 : options?.width ?? 900;
  const height = options?.height ?? 400;
  const aspectRatio = options?.aspectRatio ?? 1;

  React.useEffect(() => {
    if (!image) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSrc(reader.result as any);
    };
    reader.readAsDataURL(image);
  }, [image]);

  function getCropData() {
    if (!image) return;

    if (typeof cropper !== "undefined") {
      cropper.getCroppedCanvas().toBlob((blob) => {
        if (!blob) return;

        onSuccess(blob, image.name);
      });
    }
  }

  return (
    <Modal modalStyles={{ width }} title={common("cropImage")} isOpen={isOpen} onClose={onClose}>
      {src ? (
        <Cropper
          style={{ height, width: "100%" }}
          zoomTo={0.5}
          initialAspectRatio={aspectRatio}
          src={src}
          viewMode={1}
          aspectRatio={aspectRatio}
          minCropBoxHeight={80}
          minCropBoxWidth={80}
          background={false}
          responsive
          autoCropArea={1}
          checkOrientation={false} // https://github.com/fengyuanchen/cropperjs/issues/671
          onInitialized={(instance) => {
            setCropper(instance);
          }}
          guides
        />
      ) : (
        <p className="my-3">{t("selectImageFirst")}</p>
      )}

      <div className="flex items-center justify-end gap-2 mt-2">
        <Button variant="cancel" onPress={onClose}>
          {common("cancel")}
        </Button>
        <Button disabled={!image} className="flex items-center" onPress={getCropData}>
          {common("save")}
        </Button>
      </div>
    </Modal>
  );
}
