import { ReactSortable } from "react-sortablejs";
import { ArrowsExpand } from "react-bootstrap-icons";
import { useTranslations } from "use-intl";
import { handleFilter, sortValues, TValue } from "src/pages/admin/values/[path]";
import { Button } from "components/Button";

interface ListProps {
  values: TValue[];
  search: string;
  setList: any;
  handleEdit: (value: TValue) => void;
  handleDelete: (value: TValue) => void;
}

export const SortableList = ({ values, search, setList, handleEdit, handleDelete }: ListProps) => {
  const common = useTranslations("Common");

  return (
    <ReactSortable animation={200} className="mt-5" tag="ul" list={values} setList={setList}>
      {sortValues(values)
        .filter((v) => handleFilter(v, search))
        .map((value, idx) => (
          <li
            className="my-1 bg-gray-200 dark:bg-gray-2 p-2 px-4 rounded-md flex items-center justify-between"
            key={value.id}
          >
            <div className="flex items-center">
              <span className="cursor-move">
                <ArrowsExpand className="text-gray-500 mr-2" width={15} />
              </span>

              <span className="select-none text-gray-500">{++idx}.</span>
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
};
