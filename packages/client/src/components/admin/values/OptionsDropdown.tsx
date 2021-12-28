import * as React from "react";
import { Menu, Transition } from "@headlessui/react";
import { ThreeDots } from "react-bootstrap-icons";
import { useTranslations } from "next-intl";
import { Button } from "components/Button";
import { ModalIds } from "types/ModalIds";
import { useModal } from "context/ModalContext";
import { useDownload } from "@casper124578/useful";
import { TValue } from "src/pages/admin/values/[path]";

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
    <>
      <Menu as="div" className="relative z-50 inline-block text-left">
        <Menu.Button as={Button} className="flex items-center h-full">
          <ThreeDots width={15} height={15} className="text-gray-700 dark:text-gray-300" />
        </Menu.Button>

        <Transition
          as={React.Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 mt-2 origin-top-left bg-white rounded-md shadow-lg w-36 dark:bg-dark-bright">
            <div className="px-1 py-1 ">
              <Menu.Item>
                <Button onClick={() => openModal(ModalIds.ImportValues)}>
                  {t("importValues")}
                </Button>
              </Menu.Item>

              <Menu.Item disabled>
                <Button onClick={handleExport} disabled>
                  {t("exportValues")}
                </Button>
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </>
  );
}
