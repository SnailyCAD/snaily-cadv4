import { DEPARTMENT_LABELS, SHOULD_DO_LABELS } from "components/admin/values/ManageValueModal";
import { useTranslations } from "next-intl";
import { TValue } from "src/pages/admin/values/[path]";
import {
  type StatusValue,
  StatusValueType,
  type ValueType,
  DepartmentValue,
  DivisionValue,
  VehicleValue,
} from "types/prisma";

const TYPE_LABELS = {
  [StatusValueType.SITUATION_CODE]: "Situation Code",
  [StatusValueType.STATUS_CODE]: "Status Code",
};

export function getTableDataOfType(type: ValueType, value: TValue) {
  switch (type) {
    case "CODES_10": {
      const v = value as StatusValue;
      return {
        shouldDo: SHOULD_DO_LABELS[v.shouldDo],
        type: TYPE_LABELS[v.type],
        color: v.color,
      };
    }
    case "DEPARTMENT": {
      const v = value as DepartmentValue;

      return {
        callsign: v.callsign,
        type: DEPARTMENT_LABELS[v.type],
      };
    }
    case "DIVISION": {
      const v = value as DivisionValue;

      return {
        callsign: v.callsign,
        department: v.department?.value?.value ?? "",
      };
    }
    case "VEHICLE":
    case "WEAPON": {
      const v = value as VehicleValue;

      return {
        gameHash: v.hash,
      };
    }
    default: {
      return {};
    }
  }
}

export function useTableHeadersOfType(type: ValueType) {
  const common = useTranslations("Common");
  const t = useTranslations("Values");

  switch (type) {
    case "CODES_10": {
      return [
        {
          Header: t("shouldDo"),
          accessor: "shouldDo",
        },
        {
          Header: common("type"),
          accessor: "type",
        },
        {
          Header: t("color"),
          accessor: "color",
        },
      ];
    }
    case "DEPARTMENT": {
      return [
        {
          Header: t("callsign"),
          accessor: "callsign",
        },
        {
          Header: common("type"),
          accessor: "type",
        },
      ];
    }
    case "DIVISION": {
      return [
        {
          Header: t("callsign"),
          accessor: "callsign",
        },
        {
          Header: t("department"),
          accessor: "department",
        },
      ];
    }
    case "VEHICLE":
    case "WEAPON": {
      return [
        {
          Header: t("gameHash"),
          accessor: "gameHash",
        },
      ];
    }
    default: {
      return [];
    }
  }
}
