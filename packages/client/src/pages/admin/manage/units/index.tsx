import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Head from "next/head";
import { AdminLayout } from "components/admin/AdminLayout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { makeUnitName, requestAll } from "lib/utils";
import { GetServerSideProps } from "next";
import { FullDeputy, FullOfficer } from "state/dispatchState";
import { useTranslations } from "use-intl";
import { Button } from "components/Button";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { Menu, Transition } from "@headlessui/react";
import { ThreeDots } from "react-bootstrap-icons";
import { useMounted, usePortal } from "@casper124578/useful";
import useFetch from "lib/useFetch";
import { useRouter } from "next/router";

type Unit = (FullOfficer & { type: "OFFICER" }) | (FullDeputy & { type: "DEPUTY" });

interface Props {
  units: Unit[];
}

export default function SupervisorPanelPage({ units }: Props) {
  const [selectedRows, setSelectedRows] = React.useState<`${Unit["id"]}-${Unit["type"]}`[]>([]);

  const t = useTranslations();
  const common = useTranslations("Common");
  const generateCallsign = useGenerateCallsign();
  const { execute } = useFetch();
  const router = useRouter();

  function handleCheckboxChange(unit: Unit) {
    setSelectedRows((prev) => {
      if (prev.includes(`${unit.id}-${unit.type}`)) {
        return prev.filter((v) => v !== `${unit.id}-${unit.type}`);
      }

      return [...prev, `${unit.id}-${unit.type}`];
    });
  }

  async function setSelectedUnitsOffDuty() {
    const { json } = await execute("/admin/manage/units/off-duty", {
      method: "PUT",
      data: { ids: selectedRows },
    });

    if (Array.isArray(json)) {
      setSelectedRows([]);
      router.replace({
        pathname: router.pathname,
        query: router.query,
      });
    }
  }

  const LABELS = {
    DEPUTY: t("Ems.deputy"),
    OFFICER: t("Leo.officer"),
  };

  return (
    <AdminLayout className="dark:text-white">
      <Head>
        <title>{t("Management.MANAGE_UNITS")}</title>
      </Head>

      <h1 className="mb-4 text-3xl font-semibold">{t("Management.MANAGE_UNITS")}</h1>

      <div className="w-full mt-3 overflow-x-auto">
        <table className="w-full overflow-hidden whitespace-nowrap max-h-64">
          <thead>
            <tr>
              <th>
                <Dropdown onClick={setSelectedUnitsOffDuty} />
              </th>
              <th>
                {t("Ems.deputy")}/{t("Leo.officer")}
              </th>
              <th>{common("name")}</th>
              <th>{t("Leo.callsign")}</th>
              <th>{t("Leo.badgeNumber")}</th>
              <th>{t("Leo.department")}</th>
              <th>{t("Leo.division")}</th>
              <th>{t("Leo.rank")}</th>
              <th>{t("Leo.status")}</th>
              <th>{common("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {units.map((unit) => (
              <tr key={unit.id}>
                <td>
                  <input
                    checked={selectedRows.includes(`${unit.id}-${unit.type}`)}
                    onChange={() => handleCheckboxChange(unit)}
                    type="checkbox"
                  />
                </td>
                <td>{LABELS[unit.type]}</td>
                <td className="capitalize">{makeUnitName(unit)}</td>
                <td> {generateCallsign(unit)}</td>
                <td>{String(unit.badgeNumber)}</td>
                <td>{unit.department?.value?.value}</td>
                <td>{unit.division?.value?.value}</td>
                <td>{unit.rank?.value ?? common("none")}</td>
                <td>{unit.status?.value?.value ?? common("none")}</td>
                <td className="w-36">
                  <Link href={`/admin/manage/units/${unit.id}`}>
                    <a>
                      <Button small variant="success">
                        {common("manage")}
                      </Button>
                    </a>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, locale }) => {
  const [units] = await requestAll(req, [["/admin/manage/units", []]]);

  return {
    props: {
      units,
      session: await getSessionUser(req),
      messages: {
        ...(await getTranslations(["admin", "leo", "ems-fd", "values", "common"], locale)),
      },
    },
  };
};

const Dropdown = ({ onClick }: { onClick: any }) => {
  const mounted = useMounted();
  const portalRef = usePortal("dropdown_portal_above_table");
  const ref = React.useRef<HTMLButtonElement>(null);

  const position = ref.current?.getBoundingClientRect();

  return (
    <>
      <Menu as="div" className="relative z-50 inline-block text-left">
        <Menu.Button
          ref={ref}
          className="inline-flex justify-center w-full px-1 py-2 text-sm font-medium text-white bg-transparent rounded-md focus:outline-none"
        >
          <ThreeDots />
        </Menu.Button>

        {mounted && portalRef
          ? createPortal(
              <Transition
                as={React.Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items
                  style={{ top: (position?.top ?? 0) + 25, left: position?.left }}
                  className="fixed top-0 left-0 z-50 w-48 mt-0 origin-top-left bg-white divide-y divide-gray-100 rounded-md shadow-xl dark:bg-dark-bright dark:divide-dark-bg focus:outline-none"
                >
                  <div className="px-1 py-1 ">
                    <Menu.Item>
                      <button
                        onClick={onClick}
                        className="text-gray-900 dark:text-gray-200 block hover:bg-gray-200 dark:hover:bg-dark-bg group rounded-md items-center w-full px-3 py-1.5 text-sm transition-all"
                      >
                        Set selected units off-duty
                      </button>
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>,
              portalRef,
            )
          : null}
      </Menu>
    </>
  );
};
