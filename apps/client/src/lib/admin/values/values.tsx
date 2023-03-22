import { LICENSE_LABELS } from "components/admin/values/manage-modal/LicenseFields";
import { yesOrNoText } from "lib/utils";
import { useTranslations } from "next-intl";
import {
  type StatusValue,
  StatusValueType,
  ValueType,
  type DepartmentValue,
  type DivisionValue,
  type VehicleValue,
  type Value,
  ShouldDoType,
  QualificationValue,
  CallTypeValue,
  type AnyValue,
  AddressValue,
} from "@snailycad/types";
import {
  SHOULD_DO_LABELS,
  useDefaultDepartments,
  WHAT_PAGES_LABELS,
} from "components/admin/values/manage-modal/StatusValueFields";
import { DEPARTMENT_LABELS } from "components/admin/values/manage-modal/DepartmentFields";
import { isBaseValue, hasValueObj } from "@snailycad/utils";
import { useImageUrl } from "hooks/useImageUrl";
import { makeDefaultWhatPages } from "./utils";
import type { ColumnDef } from "@tanstack/react-table";
import { ImageWrapper } from "components/shared/image-wrapper";

const TYPE_LABELS = {
  [StatusValueType.SITUATION_CODE]: "Situation Code",
  [StatusValueType.STATUS_CODE]: "Status Code",
};

export function useTableDataOfType(type: ValueType) {
  const common = useTranslations("Common");
  const defaultDepartments = useDefaultDepartments();
  const { makeImageUrl } = useImageUrl();

  function get(value: AnyValue) {
    // state mismatch prevention
    const valueType = isBaseValue(value)
      ? value.type
      : hasValueObj(value)
      ? value.value.type
      : ("PENAL_CODE" as const);

    if (valueType !== type) return;

    switch (type) {
      case ValueType.ADDRESS: {
        const v = value as AddressValue;

        return {
          postal: v.postal,
          county: v.county,
        };
      }
      case ValueType.CODES_10: {
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
      case ValueType.DEPARTMENT: {
        const v = value as DepartmentValue & { defaultOfficerRank: Value | null };

        return {
          callsign: v.callsign || common("none"),
          type: DEPARTMENT_LABELS[v.type],
          whitelisted: common(yesOrNoText(v.whitelisted)),
          isDefaultDepartment: common(yesOrNoText(v.isDefaultDepartment)),
          defaultOfficerRank: v.defaultOfficerRank?.value ?? common("none"),
          isConfidential: common(yesOrNoText(v.isConfidential)),
        };
      }
      case ValueType.DIVISION: {
        const v = value as DivisionValue & { department: DepartmentValue };

        return {
          callsign: v.callsign || common("none"),
          pairedUnitTemplate: v.pairedUnitTemplate ?? common("none"),
          department: v.department.value.value,
        };
      }
      case ValueType.VEHICLE:
      case ValueType.WEAPON: {
        const v = value as VehicleValue;

        return {
          gameHash: v.hash || common("none"),
        };
      }
      case ValueType.LICENSE: {
        const v = value as Value;

        return {
          licenseType: v.licenseType ? LICENSE_LABELS[v.licenseType] : common("none"),
          isDefault: common(yesOrNoText(v.isDefault)),
        };
      }
      case ValueType.QUALIFICATION: {
        const v = value as QualificationValue;
        const imgUrl = makeImageUrl("values", v.imageId);

        return {
          image: imgUrl ? (
            <ImageWrapper
              quality={70}
              alt={v.value.value}
              loading="lazy"
              src={imgUrl}
              width={50}
              height={50}
              className="object-cover"
            />
          ) : (
            "—"
          ),
          departments: v.departments?.map((v) => v.value.value).join(", ") || common("none"),
          type: v.qualificationType.toLowerCase(),
        };
      }
      case ValueType.OFFICER_RANK: {
        const v = value as Value;
        const imgUrl = makeImageUrl("values", v.officerRankImageId);
        const departments = defaultDepartments(v);

        return {
          image: imgUrl ? (
            <ImageWrapper
              quality={70}
              alt={v.value}
              loading="lazy"
              src={imgUrl}
              width={50}
              height={50}
              className="object-cover"
            />
          ) : (
            "—"
          ),
          departments: departments.map((v) => v.label).join(", "),
        };
      }
      case ValueType.CALL_TYPE: {
        const v = value as CallTypeValue;

        return {
          priority: v.priority ?? common("none"),
        };
      }
      default: {
        return {};
      }
    }
  }

  return get;
}

export function useTableHeadersOfType(type: ValueType): ColumnDef<{ id: string }>[] {
  const common = useTranslations("Common");
  const t = useTranslations("Values");

  switch (type) {
    case ValueType.ADDRESS: {
      return [
        { header: t("county"), accessorKey: "county" },
        { header: common("postal"), accessorKey: "postal" },
      ];
    }

    case ValueType.CODES_10: {
      return [
        { header: t("shouldDo"), accessorKey: "shouldDo" },
        { header: common("type"), accessorKey: "type" },
        { header: t("color"), accessorKey: "color" },
        { header: t("whatPages"), accessorKey: "whatPages" },
        { header: t("departments"), accessorKey: "departments" },
      ];
    }
    case ValueType.DEPARTMENT: {
      return [
        { header: t("callsign"), accessorKey: "callsign" },
        { header: common("type"), accessorKey: "type" },
        { header: t("whitelisted"), accessorKey: "whitelisted" },
        { header: t("isDefaultDepartment"), accessorKey: "isDefaultDepartment" },
        { header: t("defaultOfficerRank"), accessorKey: "defaultOfficerRank" },
        { header: t("isConfidential"), accessorKey: "isConfidential" },
      ];
    }
    case ValueType.DIVISION: {
      return [
        { header: t("callsign"), accessorKey: "callsign" },
        { header: t("department"), accessorKey: "department" },
        { header: t("pairedUnitTemplate"), accessorKey: "pairedUnitTemplate" },
      ];
    }
    case ValueType.VEHICLE:
    case ValueType.WEAPON: {
      return [{ header: t("gameHash"), accessorKey: "gameHash" }];
    }
    case ValueType.LICENSE: {
      return [
        { header: t("licenseType"), accessorKey: "licenseType" },
        { header: t("isDefault"), accessorKey: "isDefault" },
      ];
    }
    case ValueType.QUALIFICATION: {
      return [
        { header: common("image"), accessorKey: "image" },
        { header: t("departments"), accessorKey: "departments" },
        { header: common("type"), accessorKey: "type" },
      ];
    }
    case ValueType.OFFICER_RANK: {
      return [
        { header: common("image"), accessorKey: "image" },
        { header: t("departments"), accessorKey: "departments" },
      ];
    }
    case ValueType.CALL_TYPE: {
      return [{ header: t("priority"), accessorKey: "priority" }];
    }
    default: {
      return [];
    }
  }
}
