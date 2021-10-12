import * as React from "react";
import { Star } from "react-bootstrap-icons";
import Link from "next/link";
import { GetServerSideProps } from "next";
import ReactMarkdown from "react-markdown";
import { Button } from "components/Button";
import { Layout } from "components/Layout";
import { getSessionUser } from "lib/auth";
import { handleRequest } from "lib/fetch";
import { getTranslations } from "lib/getTranslation";
import { useModal } from "context/ModalContext";
import { ModalIds } from "types/ModalIds";
import { ManageBusinessPostModal } from "components/business/ManagePostModal";
import { FullBusiness, FullEmployee, useBusinessState } from "state/businessState";
import { useTranslations } from "use-intl";
import { BusinessPost } from "types/prisma";

interface Props {
  employee: FullEmployee | null;
  business: FullBusiness | null;
}

export default function BusinessId(props: Props) {
  const { openModal } = useModal();
  const { currentBusiness, currentEmployee, posts, ...state } = useBusinessState();
  const common = useTranslations("Common");

  const [tempPost, setTempPost] = React.useState<BusinessPost | null>(null);

  function handleEdit(post: BusinessPost) {
    openModal(ModalIds.ManageBusinessPost);
    setTempPost(post);
  }

  React.useEffect(() => {
    state.setCurrentBusiness(props.business);
    state.setCurrentEmployee(props.employee);
    state.setPosts(props.business?.businessPosts ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props, state.setCurrentEmployee, state.setCurrentBusiness, state.setPosts]);

  const owner = currentBusiness?.employees.find((v) => v.citizenId === currentBusiness.citizenId);

  if (!currentBusiness || !currentEmployee) {
    return null;
  }

  return (
    <Layout>
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">{currentBusiness.name}</h1>

        <div>
          {currentEmployee.canCreatePosts ? (
            <Button onClick={() => openModal(ModalIds.ManageBusinessPost)} className="mr-2">
              Create Post
            </Button>
          ) : null}
          {owner?.citizenId === "ckuo93jc40345dupg1ezlbbx3" ? (
            <Link href={`/business/${currentBusiness.id}/manage`}>
              <a>
                <Button>Manage</Button>
              </a>
            </Link>
          ) : null}
        </div>
      </header>

      <main className="flex flex-col sm:flex-row mt-5">
        <section className="w-full mr-5">
          <ul className="space-y-3">
            {posts.map((post) => {
              const publishedBy = currentBusiness.employees.find((em) => em.id === post.employeeId);

              return (
                <li className="bg-gray-100 overflow-hidden rounded-md" key={post.id}>
                  <header className="p-4 flex items-center justify-between">
                    <h3 className="text-2xl font-semibold">{post.title}</h3>

                    {post.employeeId === currentEmployee.id ? (
                      <div>
                        <Button onClick={() => handleEdit(post)} small variant="success">
                          {common("edit")}
                        </Button>
                        <Button className="ml-2" small variant="danger">
                          {common("delete")}
                        </Button>
                      </div>
                    ) : null}
                  </header>

                  <main className="p-4 pt-0">
                    <ReactMarkdown>{post.body}</ReactMarkdown>
                  </main>

                  {publishedBy ? (
                    <footer className="bg-gray-200/30 px-4 py-2">
                      <span className="font-semibold">Published by: </span>
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

        <aside className="w-[15.5rem]">
          <h3 className="text-xl font-semibold">Employees</h3>

          <ul className="flex flex-col space-y-2">
            {currentBusiness.employees
              .sort((a, b) => Number(a.employeeOfTheMonth) - Number(b.employeeOfTheMonth))
              .map((employee) => (
                <li className="flex items-center" key={employee.id}>
                  {employee.employeeOfTheMonth ? (
                    <span title={"Employee of the month"} className="mr-2">
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
          onClose={() => setTimeout(() => setTempPost(null), 100)}
        />
      ) : null}
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query, locale, req }) => {
  const { data: business } = await handleRequest(
    `/businesses/business/${query.id}?employeeId=${query.employeeId}`,
    {
      headers: req.headers,
    },
  ).catch(() => ({ data: null }));

  return {
    props: {
      business,
      employee: business?.employee ?? null,
      session: await getSessionUser(req.headers),
      messages: {
        ...(await getTranslations(["common"], locale)),
      },
    },
  };
};
