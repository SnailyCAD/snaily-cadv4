import * as React from "react";
import { Listbox, Transition } from "@headlessui/react";
import { ChevronDown, X } from "react-bootstrap-icons";

export interface SelectValue<Value = string> {
  label: string;
  value: Value;
}

interface Props extends Pick<JSX.IntrinsicElements["input"], "onChange" | "name"> {
  value: string;
  values: SelectValue[];
  hasError?: boolean;
  isClearable?: boolean;
  disabled?: boolean;
}

export const Select = ({
  hasError,
  values,
  value,
  isClearable,
  disabled = true,
  name,
  onChange,
}: Props) => {
  const [selected, setSelected] = React.useState<SelectValue | null>(null);

  React.useEffect(() => {
    const v = values.find((v) => v.value === value);

    if (value && v) {
      setSelected(v);
    } else {
      setSelected(null);
    }
  }, [value, values]);

  function handleChange(value: SelectValue | null) {
    onChange?.({ target: { name, value: value?.value ?? null } } as any);
  }

  return (
    <Listbox value={selected} onChange={handleChange}>
      <div className="relative mt-1">
        <Listbox.Button
          className={`
            w-full p-1.5 px-3 bg-white rounded-md border-[1.5px] border-gray-200
            outline-none focus:border-gray-800
            hover:border-dark-gray cursor-default text-left z-0
            transition-all ${hasError && "border-red-500"} `}
          disabled={disabled}
        >
          <span className="block truncate">{selected ? selected.label : "None"}</span>

          <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <ChevronDown className="text-gray-500" />
          </span>
          {isClearable ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                handleChange(null);
              }}
              className="absolute inset-y-0 right-0 flex items-center pr-8 cursor-pointer"
            >
              <X height={20} width={20} className="text-gray-500" />
            </span>
          ) : null}
        </Listbox.Button>
        <Transition
          as={React.Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Listbox.Options className="absolute z-20 w-full p-1.5 px-0 mt-1 overflow-auto text-base bg-gray-300 rounded-md shadow-lg max-h-60 sm:text-sm">
            {values.map((value, idx) => (
              <Listbox.Option
                key={idx}
                value={value}
                className={({ active }) =>
                  `${
                    active ? "bg-gray-400" : "text-gray-900"
                  } cursor-default select-none relative p-1 px-4`
                }
              >
                {({ selected }) => (
                  <span className={`${selected ? "font-semibold" : "font-normal"}  block truncate`}>
                    {value.label}
                  </span>
                )}
              </Listbox.Option>
            ))}
          </Listbox.Options>
        </Transition>
      </div>
    </Listbox>
  );
};
