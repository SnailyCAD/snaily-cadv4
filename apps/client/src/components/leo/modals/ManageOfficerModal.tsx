import * as React from "react";
import { CREATE_OFFICER_SCHEMA } from "@snailycad/schemas";
import { Loader, Button } from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Formik, FormikHelpers } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";
import type { IndividualDivisionCallsign, Officer } from "@snailycad/types";
import { useFeatureEnabled } from "hooks/useFeatureEnabled";
import { UnitQualificationsTable } from "../qualifications/UnitQualificationsTable";
import { classNames } from "lib/classNames";
import type {
  PostMyOfficerByIdData,
  PostMyOfficersData,
  PutMyOfficerByIdData,
} from "@snailycad/types/api";
import {
  getManageOfficerFieldsDefaults,
  ManageOfficerFields,
} from "../manage-officer/manage-officer-fields";
import { validateFile } from "components/form/inputs/ImageSelectInput";

interface Props {
  officer: Officer | null;
  onCreate?(officer: Officer): void;
  onUpdate?(old: Officer, newO: Officer): void;
  onClose?(): void;
}

export function ManageOfficerModal({ officer, onClose, onUpdate, onCreate }: Props) {
  const [image, setImage] = React.useState<File | string | null>(null);

  const { isOpen, closeModal } = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Leo");
  const formRef = React.useRef<HTMLFormElement>(null);
  const features = useFeatureEnabled();

  const { state, execute } = useFetch();

  function handleClose() {
    closeModal(ModalIds.ManageOfficer);
    onClose?.();
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const fd = new FormData();
    const validatedImage = validateFile(image, helpers);

    if (validatedImage) {
      if (typeof validatedImage !== "string") {
        fd.set("image", validatedImage, validatedImage.name);
      }
    }

    let officerId;
    const data = {
      ...values,
      helpers,
      divisions: values.divisions.map((v) => v.value),
    };
    if (officer) {
      const { json } = await execute<PutMyOfficerByIdData, typeof INITIAL_VALUES>({
        path: `/leo/${officer.id}`,
        method: "PUT",
        data,
        helpers,
      });

      officerId = json?.id;

      if (json.id) {
        onUpdate?.(officer, json);
      }
    } else {
      const { json } = await execute<PostMyOfficersData, typeof INITIAL_VALUES>({
        path: "/leo",
        method: "POST",
        data,
        helpers,
      });

      officerId = json.id;

      if (json.id) {
        onCreate?.(json);
      }
    }

    if (validatedImage && typeof validatedImage === "object") {
      await execute<PostMyOfficerByIdData, typeof INITIAL_VALUES>({
        path: `/leo/image/${officerId}`,
        method: "POST",
        data: fd,
        helpers,
        headers: {
          "content-type": "multipart/form-data",
        },
      });
    }

    if (officerId) {
      closeModal(ModalIds.ManageOfficer);
    }
  }

  const validate = handleValidate(CREATE_OFFICER_SCHEMA);
  const INITIAL_VALUES = getManageOfficerFieldsDefaults({ officer, features });

  return (
    <Modal
      title={officer ? t("editOfficer") : t("createOfficer")}
      onClose={handleClose}
      isOpen={isOpen(ModalIds.ManageOfficer)}
      className={officer ? "w-[1000px]" : "w-[650px]"}
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleSubmit, isValid }) => (
          <form
            className={classNames(officer && "flex flex-col md:flex-row gap-5")}
            ref={formRef}
            onSubmit={handleSubmit}
          >
            <div>
              <ManageOfficerFields image={image} setImage={setImage} />

              <footer className="flex justify-end mt-5">
                <Button type="reset" onPress={handleClose} variant="cancel">
                  {common("cancel")}
                </Button>
                <Button
                  className="flex items-center"
                  disabled={!isValid || state === "loading"}
                  type="submit"
                >
                  {state === "loading" ? <Loader className="mr-2" /> : null}
                  {officer ? common("save") : common("create")}
                </Button>
              </footer>
            </div>

            <div className="md:min-w-[400px]">
              {officer ? <UnitQualificationsTable unit={officer as any} /> : null}
            </div>
          </form>
        )}
      </Formik>
    </Modal>
  );
}

export function makeDivisionsObjectMap(officer: Officer) {
  const obj = {} as Record<string, IndividualDivisionCallsign>;
  const callsigns = officer.callsigns ?? [];

  for (const callsign of callsigns) {
    if (!callsign.divisionId) continue;
    obj[callsign.divisionId] = callsign;
  }

  return obj;
}
