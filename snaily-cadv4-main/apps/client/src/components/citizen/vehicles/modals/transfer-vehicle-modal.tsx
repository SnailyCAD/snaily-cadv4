import {
  Loader,
  Button,
  TextField,
  FormRow,
  SwitchField,
  AsyncListSearchField,
  Item,
} from "@snailycad/ui";
import { Modal } from "components/modal/Modal";
import { useModal } from "state/modalState";
import { Form, Formik } from "formik";
import useFetch from "lib/useFetch";
import { useTranslations } from "use-intl";
import type { Business, RegisteredVehicle } from "@snailycad/types";
import { ModalIds } from "types/modal-ids";
import { handleValidate } from "lib/handleValidate";
import { TRANSFER_VEHICLE_SCHEMA } from "@snailycad/schemas";
import { CitizenSuggestionsField } from "components/shared/CitizenSuggestionsField";
import type { PostCitizenTransferVehicleData } from "@snailycad/types/api";

interface Props {
  vehicle: RegisteredVehicle;
  onTransfer?(vehicle: RegisteredVehicle): void;
}

export function TransferVehicleModal({ onTransfer, vehicle }: Props) {
  const modalState = useModal();
  const common = useTranslations("Common");
  const t = useTranslations("Vehicles");
  const { state, execute } = useFetch();

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const { json } = await execute<PostCitizenTransferVehicleData>({
      path: `/vehicles/transfer/${vehicle.id}`,
      method: "POST",
      data: values,
    });

    if (json.id) {
      onTransfer?.({ ...vehicle, ...json });
      modalState.closeModal(ModalIds.TransferVehicle);
    }
  }

  const validate = handleValidate(TRANSFER_VEHICLE_SCHEMA);
  const INITIAL_VALUES = {
    transferType: "citizen" as "citizen" | "business",
    businessName: "",
    businessId: "",

    ownerId: "",
    name: "",
  };

  return (
    <Modal
      title={t("transferVehicle")}
      onClose={() => modalState.closeModal(ModalIds.TransferVehicle)}
      isOpen={modalState.isOpen(ModalIds.TransferVehicle)}
      className="w-[750px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ isValid, values, errors, setValues, setFieldValue }) => (
          <Form>
            <p className="my-2 mb-5">
              {t.rich("transferVehicleInfo", {
                model: vehicle.model.value.value,
                span: (children) => <span className="font-medium">{children}</span>,
              })}
            </p>

            <SwitchField
              onChange={(isSelected) =>
                setFieldValue("transferType", isSelected ? "business" : "citizen")
              }
            >
              {t("transferToBusiness")}
            </SwitchField>

            <FormRow>
              <TextField label={t("plate")} isDisabled defaultValue={vehicle.plate} />
              <TextField label={t("model")} isDisabled defaultValue={vehicle.model.value.value} />
            </FormRow>

            {values.transferType === "business" ? (
              <AsyncListSearchField<Business>
                className="w-full"
                allowsCustomValue
                onInputChange={(value) => setFieldValue("businessName", value)}
                onSelectionChange={(node) => {
                  if (node) {
                    setValues({
                      ...values,
                      businessName: node.value?.name ?? node.textValue,
                      businessId: node.key as string,
                    });
                  }
                }}
                localValue={values.businessName}
                errorMessage={errors.businessId}
                label="Business"
                selectedKey={values.businessId}
                fetchOptions={{
                  apiPath: (query) => `/businesses/search?query=${query}`,
                  filterTextRequired: true,
                }}
              >
                {(item) => {
                  return (
                    <Item key={item.id} textValue={item.name}>
                      {item.name}
                    </Item>
                  );
                }}
              </AsyncListSearchField>
            ) : (
              <CitizenSuggestionsField
                autoFocus
                allowsCustomValue
                label={t("owner")}
                fromAuthUserOnly={false}
                labelFieldName="name"
                valueFieldName="ownerId"
              />
            )}

            <footer className="mt-5 flex justify-end">
              <Button
                type="reset"
                onPress={() => modalState.closeModal(ModalIds.TransferVehicle)}
                variant="cancel"
              >
                {common("cancel")}
              </Button>
              <Button
                className="flex items-center"
                disabled={!isValid || state === "loading"}
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2" /> : null}
                {t("transfer")}
              </Button>
            </footer>
          </Form>
        )}
      </Formik>
    </Modal>
  );
}
