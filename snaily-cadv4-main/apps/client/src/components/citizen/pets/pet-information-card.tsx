import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  FullDate,
  Infofield,
} from "@snailycad/ui";
import { AlertModal } from "components/modal/AlertModal";
import { ImageWrapper } from "components/shared/image-wrapper";
import { useAuth } from "context/AuthContext";
import { useImageUrl } from "hooks/useImageUrl";
import useFetch from "lib/useFetch";
import { calculateAge } from "lib/utils";
import { useRouter } from "next/router";
import { ThreeDots } from "react-bootstrap-icons";
import { usePetsState } from "state/citizen/pets-state";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { useTranslations } from "use-intl";

export function PetInformationCard() {
  const t = useTranslations("Pets");
  const { cad } = useAuth();
  const currentPet = usePetsState((state) => state.currentPet);
  const modalState = useModal();
  const { state, execute } = useFetch();
  const router = useRouter();
  const { makeImageUrl } = useImageUrl();

  async function handleDeletePet() {
    if (!currentPet) return;

    const { json } = await execute<boolean>({
      path: `/pets/${currentPet.id}`,
      method: "DELETE",
    });

    if (json) {
      router.push("/pets");
      modalState.closeModal(ModalIds.AlertDeletePet);
    }
  }

  if (!currentPet) {
    return null;
  }

  return (
    <div className="flex items-start justify-between p-4 card">
      <section className="flex flex-col items-start sm:flex-row">
        {currentPet.imageId ? (
          <ImageWrapper
            quality={80}
            alt={currentPet.name}
            className="rounded-md w-[150px] h-[150px] object-cover"
            draggable={false}
            src={makeImageUrl("pets", currentPet.imageId)!}
            loading="lazy"
            width={150}
            height={150}
          />
        ) : null}

        <div className="flex flex-col mt-2 sm:ml-4 sm:mt-0">
          <Infofield label={t("name")}>{currentPet.name}</Infofield>

          <Infofield label={t("dateOfBirth")}>
            <FullDate isDateOfBirth onlyDate>
              {currentPet.dateOfBirth}
            </FullDate>{" "}
            ({t("age")}: {calculateAge(currentPet.dateOfBirth)})
          </Infofield>
          <Infofield label={t("breed")}>{currentPet.breed}</Infofield>
          <Infofield label={t("color")}>{currentPet.color}</Infofield>
        </div>

        <div className="flex flex-col sm:ml-5">
          <Infofield label={t("weight")}>
            {currentPet.weight} {cad?.miscCadSettings?.weightPrefix}
          </Infofield>

          <Infofield className="max-w-[400px]" label={t("citizen")}>
            {currentPet.citizen.name} {currentPet.citizen.surname}
          </Infofield>
        </div>
      </section>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="xs" className="flex items-center justify-center w-9 h-9">
            <ThreeDots
              aria-label="Options"
              width={17}
              height={17}
              className="text-neutral-800 dark:text-gray-300"
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent alignOffset={0} align="end">
          <DropdownMenuItem
            onClick={() => modalState.openModal(ModalIds.ManagePet)}
            variant="danger"
          >
            {t("editPet")}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => modalState.openModal(ModalIds.AlertDeletePet)}
            variant="danger"
          >
            {t("deletePet")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertModal
        title={t("deletePet")}
        description={t("alert_deletePet")}
        id={ModalIds.AlertDeletePet}
        state={state}
        onDeleteClick={handleDeletePet}
      />
    </div>
  );
}
