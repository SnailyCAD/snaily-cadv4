import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { Button, SelectField } from "@snailycad/ui";
import { useTranslations } from "use-intl";
import { useFormikContext } from "formik";
import { useCall911State } from "state/dispatch/call-911-state";
import type { Call911 } from "@snailycad/types";
import { ChevronDown } from "react-bootstrap-icons";

export function AddCallPopover() {
  const t = useTranslations("Leo");
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);
  const { errors, values, setValues, setFieldValue } = useFormikContext<{
    call911Id: string | null;
    call911: Call911 | null;
  }>();

  const calls = useCall911State((state) => state.calls);

  return (
    <Popover.Root open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <Popover.Trigger asChild>
        <span>
          <Button
            className="flex items-center gap-2"
            onPress={() => setIsPopoverOpen((v) => !v)}
            size="xs"
          >
            {values.call911?.caseNumber
              ? t("appendedActiveCall", {
                  call: `#${values.call911.caseNumber}`,
                })
              : t("addActiveCall")}
            <ChevronDown className="w-3" />
          </Button>
        </span>
      </Popover.Trigger>

      <Popover.Content className="z-50 p-4 bg-gray-200 rounded-md shadow-md dropdown-fade w-96 dark:bg-primary dark:border dark:border-secondary">
        <h3 className="text-xl font-semibold mb-3">{t("addActiveCall")}</h3>

        <SelectField
          label={t("call")}
          options={calls.map((call) => ({
            value: call.id,
            label: `#${call.caseNumber}`,
          }))}
          isClearable
          errorMessage={errors.call911Id}
          className="w-full"
          name="call911Id"
          selectedKey={values.call911Id}
          onSelectionChange={(key) => {
            if (key === null) {
              // key can be null
              setValues({ ...values, call911: null, call911Id: null });
              return;
            }

            setFieldValue("call911Id", key as string | null);
          }}
        />

        <Button
          size="xs"
          onPress={() => {
            setValues({
              ...values,
              call911: calls.find((v) => v.id === values.call911Id) ?? null,
            });

            setIsPopoverOpen(false);
          }}
        >
          {t("addActiveCall")}
        </Button>

        <Popover.Arrow className="fill-primary" />
      </Popover.Content>
    </Popover.Root>
  );
}
