import { LICENSE_LABELS } from "components/admin/values/manage-modal/LicenseFields";
import { yesOrNoText } from "lib/utils";
import { useTranslations } from "next-intl";
import type { TValue } from "src/pages/admin/values/[path]";
import {
  type StatusValue,
  StatusValueType,
  type ValueType,
  type DepartmentValue,
  type DivisionValue,
  type VehicleValue,
  type Value,
  WhatPages,
  ShouldDoType,
} from "@snailycad/types";
import {
  SHOULD_DO_LABELS,
  useDefaultDepartments,
  WHAT_PAGES_LABELS,
} from "components/admin/values/manage-modal/StatusValueFields";
import { DEPARTMENT_LABELS } from "components/admin/values/manage-modal/DepartmentFields";

const TYPE_LABELS = {
  [StatusValueType.SITUATION_CODE]: "Situation Code",
  [StatusValueType.STATUS_CODE]: "Status Code",
};

const DEFAULT_PAGES = [WhatPages.LEO, WhatPages.DISPATCH, WhatPages.EMS_FD];

export function makeDefaultWhatPages(
  status: (Omit<StatusValue, "whatPages"> & { whatPages: WhatPages[] | null }) | null,
) {
  if (!status) return [];
  const whatPages = status.whatPages ?? [];

  return whatPages.length <= 0 ? DEFAULT_PAGES : status.whatPages;
}

export function useTableDataOfType(type: ValueType) {
  const common = useTranslations("Common");
  const defaultDepartments = useDefaultDepartments();

  function get(value: TValue) {
    // state mismatch prevention
    const valueType = "createdAt" in value ? value.type : value.value.type;
    if (valueType !== type) return;

    switch (type) {
      case "CODES_10": {
        const v = value as StatusValue;
        const whatPages = makeDefaultWhatPages(v);
        const departments = defaultDepartments(v);

        return {
          shouldDo: SHOULD_DO_LABELS[v.shouldDo],
          type: TYPE_LABELS[v.type],
          whatPages: whatPages?.map((v) => WHAT_PAGES_LABELS[v]).join(", "),
          departments:
            v.shouldDo === ShouldDoType.SET_ON_DUTY
              ? "—"
              : departments.map((v) => v.label).join(", "),
          color: v.color ? (
            <>
              <span
                style={{ background: v.color }}
                className="inline-block w-2.5 h-2.5 mr-2 rounded-full"
              />
              {v.color}
            </>
          ) : (
            common("none")
          ),
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
          isDefault: common(yesOrNoText(v.isDefault)),
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
        { Header: t("whatPages"), accessor: "whatPages" },
        { Header: t("departments"), accessor: "departments" },
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
      return [
        { Header: t("licenseType"), accessor: "licenseType" },
        { Header: t("isDefault"), accessor: "isDefault" },
      ];
    }
    default: {
      return [];
    }
  }
}
