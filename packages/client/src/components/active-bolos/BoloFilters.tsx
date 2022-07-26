import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";

export function BoloFilters() {
  return (
    <div className="py-2 pt-5">
      <FormField label="Search">
        <Input />
      </FormField>
    </div>
  );
}
