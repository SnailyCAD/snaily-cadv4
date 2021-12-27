import { DEPARTMENT_LABELS, SHOULD_DO_LABELS } from "components/admin/values/ManageValueModal";
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

// todo: translations

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
        department: v.department.value.value,
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

export function getTableHeadersOfType(type: ValueType) {
  switch (type) {
    case "CODES_10": {
      return [
        {
          Header: "Should Do",
          accessor: "shouldDo",
        },
        {
          Header: "Type",
          accessor: "type",
        },
        {
          Header: "Color",
          accessor: "color",
        },
      ];
    }
    case "DEPARTMENT": {
      return [
        {
          Header: "Callsign",
          accessor: "callsign",
        },
        {
          Header: "Type",
          accessor: "type",
        },
      ];
    }
    case "DIVISION": {
      return [
        {
          Header: "Callsign",
          accessor: "callsign",
        },
        {
          Header: "Department",
          accessor: "department",
        },
      ];
    }
    case "VEHICLE":
    case "WEAPON": {
      return [
        {
          Header: "Game hash",
          accessor: "gameHash",
        },
      ];
    }
    default: {
      return [];
    }
  }
}
