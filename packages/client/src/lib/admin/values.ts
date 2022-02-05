import {
  DEPARTMENT_LABELS,
  LICENSE_LABELS,
  SHOULD_DO_LABELS,
} from "components/admin/values/ManageValueModal";
import { yesOrNoText } from "lib/utils";
import { useTranslations } from "next-intl";
import type { TValue } from "src/pages/admin/values/[path]";
import {
  type StatusValue,
  StatusValueType,
  type ValueType,
  DepartmentValue,
  DivisionValue,
  VehicleValue,
  Value,
} from "@snailycad/types";

const TYPE_LABELS = {
  [StatusValueType.SITUATION_CODE]: "Situation Code",
  [StatusValueType.STATUS_CODE]: "Status Code",
};

export function useTableDataOfType(type: ValueType) {
  const common = useTranslations("Common");

  function get(value: TValue) {
    // state mismatch prevention
    const valueType = "type" in value ? value.type : value.value.type;
    if (valueType !== type) return;

    switch (type) {
      case "CODES_10": {
        const v = value as StatusValue;
        return {
          shouldDo: SHOULD_DO_LABELS[v.shouldDo],
          type: TYPE_LABELS[v.type],
          color: v.color || common("none"),
        };
      }
      case "DEPARTMENT": {
        const v = value as DepartmentValue;

        return {
          callsign: v.callsign || common("none"),
          type: DEPARTMENT_LABELS[v.type],
          whitelisted: common(yesOrNoText(v.whitelisted)),
          isDefaultDepartment: common(yesOrNoText(v.isDefaultDepartment)),
        };
      }
      case "DIVISION": {
        const v = value as DivisionValue;

        return {
          callsign: v.callsign || common("none"),
          department: v.department.value.value,
        };
      }
      case "VEHICLE":
      case "WEAPON": {
        const v = value as VehicleValue;

        return {
          gameHash: v.hash || common("none"),
        };
      }
      case "LICENSE": {
        const v = value as Value<ValueType.LICENSE>;

        return {
          licenseType: v.licenseType ? LICENSE_LABELS[v.licenseType] : common("none"),
        };
      }
      default: {
        return {};
      }
    }
  }

  return get;
}

export function useTableHeadersOfType(type: ValueType) {
  const common = useTranslations("Common");
  const t = useTranslations("Values");

  switch (type) {
    case "CODES_10": {
      return [
        { Header: t("shouldDo"), accessor: "shouldDo" },
        { Header: common("type"), accessor: "type" },
        { Header: t("color"), accessor: "color" },
      ];
    }
    case "DEPARTMENT": {
      return [
        { Header: t("callsign"), accessor: "callsign" },
        { Header: common("type"), accessor: "type" },
        { Header: t("whitelisted"), accessor: "whitelisted" },
        { Header: t("isDefaultDepartment"), accessor: "isDefaultDepartment" },
      ];
    }
    case "DIVISION": {
      return [
        { Header: t("callsign"), accessor: "callsign" },
        { Header: t("department"), accessor: "department" },
      ];
    }
    case "VEHICLE":
    case "WEAPON": {
      return [{ Header: t("gameHash"), accessor: "gameHash" }];
    }
    case "LICENSE": {
      return [{ Header: t("licenseType"), accessor: "licenseType" }];
    }
    default: {
      return [];
    }
  }
}
