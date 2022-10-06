import * as React from "react";
import { Star } from "react-bootstrap-icons";
import Link from "next/link";
import type { GetServerSideProps } from "next";
import { dataToSlate, Editor } from "components/editor/Editor";
import { Button, buttonVariants } from "@snailycad/ui";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { getTranslations } from "lib/getTranslation";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { useBusinessState } from "state/businessState";
import { useTranslations } from "use-intl";
import { BusinessPost, WhitelistStatus } from "@snailycad/types";
import useFetch from "lib/useFetch";
import dynamic from "next/dynamic";
import { requestAll } from "lib/utils";
import { Title } from "components/shared/Title";
import { classNames } from "lib/classNames";
import type { DeleteBusinessPostsData, GetBusinessByIdData } from "@snailycad/types/api";
import { useTemporaryItem } from "hooks/shared/useTemporaryItem";

const AlertModal = dynamic(async () => (await import("components/modal/AlertModal")).AlertModal);
const ManageBusinessPostModal = dynamic(
  async () => (await import("components/business/ManagePostModal")).ManageBusinessPostModal,
);

interface Props {
  business: GetBusinessByIdData;
  employee: GetBusinessByIdData["employee"];
}

export default function BusinessId(props: Props) {
  const { state: fetchState, execute } = useFetch();
  const { openModal, closeModal } = useModal();
  const { currentBusiness, currentEmployee, posts, ...state } = useBusinessState();
  const common = useTranslations("Common");
  const t = useTranslations("Business");
  const [tempPost, postState] = useTemporaryItem(posts);

  async function handlePostDeletion() {
    if (!tempPost) return;

    const { json } = await execute<DeleteBusinessPostsData>({
      path: `/businesses/posts/${currentBusiness?.id}/${tempPost.id}`,
      method: "DELETE",
      data: { employeeId: currentEmployee?.id },
    });

    if (json) {
      state.setPosts(posts.filter((p) => p.id !== tempPost.id));
      postState.setTempId(null);
      closeModal(ModalIds.AlertDeleteBusinessPost);
    }
  }

  function handleEdit(post: BusinessPost) {
    openModal(ModalIds.ManageBusinessPost);
    postState.setTempId(post.id);
  }

  function handleDelete(post: BusinessPost) {
    openModal(ModalIds.AlertDeleteBusinessPost);
    postState.setTempId(post.id);
  }

  React.useEffect(() => {
    const { employee, business } = props;

    state.setCurrentBusiness(business);
    state.setCurrentEmployee(employee);
    state.setPosts(business.businessPosts);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props, state.setCurrentEmployee, state.setCurrentBusiness, state.setPosts]);

  const owner = currentBusiness?.employees?.find((v) => v.citizenId === currentBusiness.citizenId);

  if (!currentBusiness || !currentEmployee) {
    return null;
  }

  if (currentEmployee.whitelistStatus === WhitelistStatus.PENDING) {
    return (
      <Layout className="dark:text-white">
        <p>{t("businessIsWhitelisted")}</p>
      </Layout>
    );
  }

  if (props.business.status === WhitelistStatus.PENDING) {
    return (
      <Layout className="dark:text-white">
        <p>
          {t("businessWhitelistedCAD")}{" "}
          <Link href="/business">
            <a href="/business" className="underline">
              Return
            </a>
          </Link>
        </p>
      </Layout>
    );
  }

  return (
    <Layout className="dark:text-white">
      <header className="flex items-center justify-between">
        <Title className="!mb-0">{currentBusiness.name}</Title>

        <div>
          {currentEmployee.canCreatePosts ? (
            <Button onPress={() => openModal(ModalIds.ManageBusinessPost)} className="mr-2">
              {t("createPost")}
            </Button>
          ) : null}
          {owner?.citizenId === currentEmployee.citizenId ? (
            <Link href={`/business/${currentBusiness.id}/${currentEmployee.id}/manage`}>
              <a
                href={`/business/${currentBusiness.id}/${currentEmployee.id}/manage`}
                className={classNames(buttonVariants.default, "p-1 px-4 rounded-md")}
              >
                {common("manage")}
              </a>
            </Link>
          ) : null}
        </div>
      </header>

      <main className="flex flex-col mt-5 sm:flex-row">
        <section className="w-full mr-5">
          <ul className="space-y-3">
            {posts.map((post) => {
              const publishedBy = currentBusiness.employees.find((em) => em.id === post.employeeId);

              return (
                <li className="rounded-md card" key={post.id}>
                  <header className="flex items-center justify-between p-4">
                    <h3 className="text-2xl font-semibold">{post.title}</h3>

                    {post.employeeId === currentEmployee.id ? (
                      <div>
                        <Button onPress={() => handleEdit(post)} size="xs" variant="success">
                          {common("edit")}
                        </Button>
                        <Button
                          onPress={() => handleDelete(post)}
                          className="ml-2"
                          size="xs"
                          variant="danger"
                        >
                          {common("delete")}
                        </Button>
                      </div>
                    ) : null}
                  </header>

                  <main className="p-4 pt-0">
                    <Editor isReadonly value={dataToSlate(post)} />
                  </main>

                  {publishedBy ? (
                    <footer className="px-4 py-2 bg-gray-200/30 dark:border-t dark:border-secondary dark:bg-tertiary">
                      <span className="font-semibold">{t("publishedBy")}: </span>
                      <span>
                        {publishedBy?.citizen.name} {publishedBy?.citizen.surname}
                      </span>
                    </footer>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="w-[20rem]">
          <h3 className="text-xl font-semibold">{t("employees")}</h3>

          <ul className="flex flex-col space-y-2">
            {currentBusiness.employees
              .filter((v) => v.whitelistStatus !== WhitelistStatus.PENDING)
              .sort((a, b) => Number(b.employeeOfTheMonth) - Number(a.employeeOfTheMonth))
              .map((employee) => (
                <li className="flex items-center" key={employee.id}>
                  {employee.employeeOfTheMonth ? (
                    <span title={t("employeeOfTheMonth")} className="mr-2">
                      <Star className="text-yellow-500" />
                    </span>
                  ) : null}

                  <span className="capitalize">
                    {employee.citizen.name} {employee.citizen.surname}
                  </span>
                </li>
              ))}
          </ul>
        </aside>
      </main>

      {currentEmployee.canCreatePosts ? (
        <ManageBusinessPostModal
          post={tempPost}
          onUpdate={() => void 0}
          onCreate={(post) => state.setPosts([post, ...posts])}
          onClose={() => setTimeout(() => postState.setTempId(null), 100)}
        />
      ) : null}

      <AlertModal
        title={t("deletePost")}
        description={t("alert_deletePost")}
        id={ModalIds.AlertDeleteBusinessPost}
        onDeleteClick={handlePostDeletion}
        state={fetchState}
        onClose={() => postState.setTempId(null)}
      />
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query, locale, req }) => {
  const user = await getSessionUser(req);
  const [business] = await requestAll(req, [
    [`/businesses/business/${query.id}?employeeId=${query.employeeId}`, null],
  ]);

  return {
    notFound: !business || !business?.employee,
    props: {
      business,
      employee: business?.employee ?? null,
      session: user,
      messages: {
        ...(await getTranslations(["business", "common"], user?.locale ?? locale)),
      },
    },
  };
};
