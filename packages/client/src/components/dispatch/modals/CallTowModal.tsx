import { TOW_SCHEMA } from "@snailycad/schemas";
import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { FormRow } from "components/form/FormRow";
import { Input } from "components/form/Input";
import { Select } from "components/form/Select";
import { Textarea } from "components/form/Textarea";
import { Loader } from "components/Loader";
import { Modal } from "components/modal/Modal";
import { useModal } from "context/ModalContext";
import { useValues } from "context/ValuesContext";
import { Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { Full911Call } from "state/dispatchState";
import { useEmsFdState } from "state/emsFdState";
import { useLeoState } from "state/leoState";
import { ModalIds } from "types/ModalIds";
import { useTranslations } from "use-intl";

interface Props {
  call: Full911Call | null;
}

export function DispatchCallTowModal({ call }: Props) {
  const common = useTranslations("Common");
  const t = useTranslations();
  const { isOpen, closeModal, getPayload } = useModal();
  const { state, execute } = useFetch();
  const { activeOfficer, officers } = useLeoState();
  const { activeDeputy, deputies } = useEmsFdState();
  const router = useRouter();
  const { impoundLot } = useValues();

  const isLeo = router.pathname === "/officer";
  const isDispatch = router.pathname === "/dispatch";
  const citizensFrom = isLeo ? officers : router.pathname === "/ems-fd" ? deputies : [];
  const citizens = [...citizensFrom].map((v) => v.citizen);
  const unit = isLeo ? activeOfficer : router.pathname === "/ems-fd" ? activeDeputy : null;

  async function onSubmit(values: typeof INITIAL_VALUES) {
    const payload = getPayload<{ call911Id: string }>(ModalIds.ManageTowCall);
    const { json } = await execute("/tow", {
      method: "POST",
      data: { ...values, ...payload, creatorId: values.creatorId || null },
    });

    if (json.id) {
      // todo: add translation
      toast.success("Created.");
    }

    closeModal(ModalIds.ManageTowCall);
  }

  const validate = handleValidate(TOW_SCHEMA);
  const INITIAL_VALUES = {
    location: call?.location ?? "",
    postal: call?.postal ?? "",
    // @ts-expect-error TS should allow this tbh!
    creatorId: unit?.citizenId ?? null,
    description: call?.description ?? "",
    callCountyService: false,
    deliveryAddress: "",
    model: "",
    plate: "",
  };

  return (
    <Modal
      onClose={() => closeModal(ModalIds.ManageTowCall)}
      title={t("Calls.createTowCall")}
      isOpen={isOpen(ModalIds.ManageTowCall)}
      className="w-[700px]"
    >
      <Formik validate={validate} initialValues={INITIAL_VALUES} onSubmit={onSubmit}>
        {({ handleSubmit, handleChange, setFieldValue, values, isValid, errors }) => (
          <form onSubmit={handleSubmit}>
            {unit ? (
              <FormField errorMessage={errors.creatorId as string} label={t("citizen")}>
                <Select
                  disabled
                  name="creatorId"
                  onChange={handleChange}
                  values={citizens.map((citizen) => ({
                    label: `${citizen.name} ${citizen.surname}`,
                    value: citizen.id,
                  }))}
                  value={values.creatorId || null}
                />
              </FormField>
            ) : null}

            <FormRow>
              <FormField errorMessage={errors.location} label={t("Calls.location")}>
                <Input name="location" value={values.location} onChange={handleChange} />
              </FormField>

              <FormField errorMessage={errors.postal} label={t("Calls.postal")}>
                <Input name="postal" value={values.postal} onChange={handleChange} />
              </FormField>
            </FormRow>

            {isLeo || isDispatch ? (
              <>
                <FormField errorMessage={errors.deliveryAddress} label={t("Calls.deliveryAddress")}>
                  <Select
                    isClearable
                    name="deliveryAddress"
                    onChange={handleChange}
                    values={impoundLot.values.map((lot) => ({
                      label: lot.value,
                      value: lot.id,
                    }))}
                    value={values.deliveryAddress}
                  />
                </FormField>

                <FormField errorMessage={errors.plate} label={t("Vehicles.plate")}>
                  <Input onChange={handleChange} name="plate" value={values.plate} />
                </FormField>

                <FormField errorMessage={errors.model} label={t("Vehicles.model")}>
                  <Input onChange={handleChange} name="model" value={values.model} />
                </FormField>
              </>
            ) : null}

            <FormField
              errorMessage={errors.callCountyService}
              checkbox
              label={"Call County Service"}
            >
              <Input
                type="checkbox"
                name="callCountyService"
                onChange={() => setFieldValue("callCountyService", !values.callCountyService)}
                checked={values.callCountyService}
                className="w-[max-content] ml-1"
              />
            </FormField>

            <FormField errorMessage={errors.description} label={common("description")}>
              <Textarea name="description" onChange={handleChange} value={values.description} />
            </FormField>

            <footer className="flex justify-end mt-5">
              <div className="flex items-center">
                <Button
                  type="reset"
                  onClick={() => closeModal(ModalIds.ManageTowCall)}
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
                  {common("create")}
                </Button>
              </div>
            </footer>
          </form>
        )}
      </Formik>
    </Modal>
  );
}
