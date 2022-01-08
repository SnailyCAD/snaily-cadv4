import * as React from "react";
import { ThreeDots } from "react-bootstrap-icons";
import { useTranslations } from "next-intl";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { useDownload } from "@casper124578/useful";
import { TValue } from "src/pages/admin/values/[path]";
import { Dropdown } from "components/Dropdown";

export function OptionsDropdown({ values }: { values: TValue[] }) {
  const t = useTranslations("Values");
  const { openModal } = useModal();
  const download = useDownload();

  function handleExport() {
    download({
      filename: `products_${Date.now()}.json`,
      // todo: remove extra properties such as id
      data: JSON.stringify(values, null, 4),
    });
  }

  return (
    <Dropdown
      alignOffset={0}
      align="end"
      className="dropdown-right"
      trigger={
        <Button className="flex items-center justify-center w-8 h-8">
          <ThreeDots width={15} height={15} className="text-gray-700 dark:text-gray-300" />
        </Button>
      }
    >
      <Dropdown.Item onClick={() => openModal(ModalIds.ImportValues)}>
        {t("importValues")}
      </Dropdown.Item>
      <Dropdown.Item onClick={handleExport} disabled>
        {t("exportValues")}
      </Dropdown.Item>
    </Dropdown>
  );
}
