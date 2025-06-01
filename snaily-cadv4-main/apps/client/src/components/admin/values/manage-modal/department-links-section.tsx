import { Button, TextField } from "@snailycad/ui";
import * as Popover from "@radix-ui/react-popover";
import * as React from "react";
import { useTranslations } from "use-intl";
import { useFormikContext } from "formik";
import type { DepartmentValueLink } from "@snailycad/types";
import { Table, useTableState } from "components/shared/Table";
import { v4 } from "uuid";
import type { ManageValueFormValues } from "../ManageValueModal";

export function DepartmentLinksSection() {
  const [openPopover, setOpenPopover] = React.useState<"new" | null>(null);
  const tableState = useTableState();
  const { values, setFieldValue } = useFormikContext<ManageValueFormValues>();
  const common = useTranslations("Common");

  return (
    <section className="mt-6">
      <header className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Links</h2>

        <LinkPopover
          isPopoverOpen={openPopover === "new"}
          setIsPopoverOpen={(v) => setOpenPopover(v ? "new" : null)}
          trigger={
            <Button onPress={() => setOpenPopover("new")} size="xs">
              Add Link
            </Button>
          }
        />
      </header>

      {values.departmentLinks.length <= 0 ? (
        <p>
          No links added yet. Click the <b>Add Link</b> button to add a link.
        </p>
      ) : (
        <Table
          features={{ isWithinCardOrModal: true }}
          tableState={tableState}
          data={values.departmentLinks.map((url) => {
            return {
              id: `${url.url}-${url.id}`,
              name: url.title,
              url: url.url,
              actions: (
                <Button
                  onPress={() => {
                    setFieldValue(
                      "departmentLinks",
                      values.departmentLinks.filter((v) => v.id !== url.id),
                    );
                  }}
                  size="xs"
                  variant="danger"
                >
                  {common("delete")}
                </Button>
              ),
            };
          })}
          columns={[
            { header: common("name"), accessorKey: "name" },
            { header: common("url"), accessorKey: "url" },
            { header: common("actions"), accessorKey: "actions" },
          ]}
        />
      )}
    </section>
  );
}

interface LinkPopoverProps {
  trigger: React.ReactNode;
  isPopoverOpen: boolean;
  setIsPopoverOpen: React.Dispatch<React.SetStateAction<boolean>>;

  url?: { name: string; url: string };
}

function LinkPopover(props: LinkPopoverProps) {
  const common = useTranslations("Common");
  const { values, setFieldValue } = useFormikContext<{ departmentLinks: DepartmentValueLink[] }>();

  const [name, setName] = React.useState(props.url?.name ?? "");
  const [url, setUrl] = React.useState(props.url?.url ?? "");

  function handleSubmit() {
    setFieldValue("departmentLinks", [...values.departmentLinks, { id: v4(), title: name, url }]);
    props.setIsPopoverOpen(false);
  }

  return (
    <Popover.Root open={props.isPopoverOpen} onOpenChange={props.setIsPopoverOpen}>
      <Popover.Trigger asChild>
        <span>{props.trigger}</span>
      </Popover.Trigger>

      <Popover.Content className="z-[999] p-4 bg-gray-200 rounded-md shadow-md dropdown-fade w-96 dark:bg-primary dark:border dark:border-secondary text-base font-normal">
        <h3 className="text-xl font-semibold mb-3">Add Link</h3>

        <div>
          <TextField label={common("name")} value={name} onChange={(value) => setName(value)} />
          <TextField
            type="url"
            label={common("url")}
            value={url}
            onChange={(value) => setUrl(value)}
          />

          <Button type="button" onPress={handleSubmit} size="xs">
            {common("save")}
          </Button>
        </div>

        <Popover.Arrow className="fill-primary" />
      </Popover.Content>
    </Popover.Root>
  );
}
