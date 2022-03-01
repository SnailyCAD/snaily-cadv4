import { ReactSortable } from "react-sortablejs";
import { ArrowsExpand } from "react-bootstrap-icons";
import { useTranslations } from "use-intl";
import { handleFilter, sortValues } from "src/pages/admin/values/[path]";
import { Button } from "components/Button";
import type { AnyValue } from "@snailycad/utils";

interface ListProps {
  values: AnyValue[];
  search: string;
  setList: any;
  handleEdit: (value: AnyValue) => void;
  handleDelete: (value: AnyValue) => void;
}

export function SortableList({ values, search, setList, handleEdit, handleDelete }: ListProps) {
  const common = useTranslations("Common");

  function checkMoved(list: AnyValue[]) {
    let wasMoved = false;

    for (let i = 0; i < values.length; i++) {
      if (values[i]?.id !== list[i]?.id) {
        wasMoved = true;
        break;
      }
    }

    /**
     * only update db if the list was actually moved.
     */
    if (wasMoved) {
      setList(list);
    }
  }

  return (
    <ReactSortable animation={200} className="mt-5" tag="ul" list={values} setList={checkMoved}>
      {sortValues(values)
        .filter((v) => handleFilter(v, search))
        .map((value, idx) => (
          <li
            className="flex items-center justify-between p-2 px-4 my-1 bg-gray-200 rounded-md dark:bg-gray-2"
            key={value.id}
          >
            <div className="flex items-center">
              <span className="cursor-move">
                <ArrowsExpand className="mr-2 text-gray-500" width={15} />
              </span>

              <span className="text-gray-500 select-none">{++idx}.</span>
              <span className="ml-2">
                {typeof value.value !== "string" && value.value.type === "DIVISION" ? (
                  <span>{(value as any).department.value?.value} / </span>
                ) : null}
                {typeof value.value === "string" ? value.value : value.value.value}
              </span>
            </div>

            <div>
              <Button onClick={() => handleEdit(value)} variant="success">
                {common("edit")}
              </Button>
              <Button onClick={() => handleDelete(value)} variant="danger" className="ml-2">
                {common("delete")}
              </Button>
            </div>
          </li>
        ))}
    </ReactSortable>
  );
}
