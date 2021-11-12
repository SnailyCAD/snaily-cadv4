import { Button } from "components/Button";
import CropperJS from "cropperjs";
import * as React from "react";
import Cropper from "react-cropper";
import { useTranslations } from "use-intl";
import { Modal } from "./Modal";

interface Props {
  onSuccess: (url: Blob, filename: string) => void;
  onClose: () => void;
  isOpen: boolean;
  image: File | null;
}

export const CropImageModal = ({ onSuccess, image, isOpen = false, onClose }: Props) => {
  const common = useTranslations("Common");

  const [src, setSrc] = React.useState(null);
  const [cropper, setCropper] = React.useState<CropperJS>();

  React.useEffect(() => {
    if (!image) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSrc(reader.result as any);
    };
    reader.readAsDataURL(image);
  }, [image]);

  const getCropData = () => {
    if (!image) return;

    if (typeof cropper !== "undefined") {
      cropper.getCroppedCanvas().toBlob((blob) => {
        console.log({ blob });
        if (!blob) return;

        onSuccess?.(blob, image.name);
      });
    }
  };

  return (
    <Modal title="Crop image" isOpen={isOpen} onClose={onClose}>
      {src ? (
        <Cropper
          style={{ height: 400, width: "100%" }}
          zoomTo={0.5}
          initialAspectRatio={1}
          src={src}
          viewMode={1}
          aspectRatio={1}
          minCropBoxHeight={10}
          minCropBoxWidth={10}
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
        <p>Select an image please</p>
      )}

      <div className="flex items-center justify-end gap-2 mt-2">
        <Button variant="cancel" onClick={onClose}>
          {common("cancel")}
        </Button>
        <Button className="flex items-center" onClick={getCropData}>
          {common("save")}
        </Button>
      </div>
    </Modal>
  );
};
