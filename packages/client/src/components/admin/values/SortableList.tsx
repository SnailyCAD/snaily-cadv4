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
        .map((value, idx) => {
          const name =
            "description" in value
              ? value.title
              : typeof value.value === "string"
              ? value.value
              : value.value.value;

          return (
            <li
              className="flex items-center justify-between p-2 px-4 my-1 bg-gray-200 rounded-md dark:bg-gray-2"
              key={value.id}
            >
              <div className="flex flex-col">
                <div className="flex items-center">
                  <span className="cursor-move">
                    <ArrowsExpand className="mr-2 text-gray-500" width={15} />
                  </span>

                  <span className="text-gray-500 select-none">{++idx}.</span>
                  <span className="ml-2">
                    {typeof value.value !== "string" &&
                    value.value &&
                    value.value.type === "DIVISION" ? (
                      <span>{(value as any).department.value?.value} / </span>
                    ) : null}
                    {name}
                  </span>
                </div>
                {"description" in value ? <p className="mt-2 ml-5">{value.description}</p> : null}
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
          );
        })}
    </ReactSortable>
  );
};
