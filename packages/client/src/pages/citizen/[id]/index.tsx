import * as React from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Citizen } from "types/prisma";
import { GetServerSideProps } from "next";
import { getSessionUser } from "lib/auth";
import { handleRequest } from "lib/fetch";
import { Layout } from "components/Layout";
import { useModal } from "src/hooks/useModal";
import { Modal } from "components/modal/Modal";
import { Button } from "components/Button";
import useFetch from "lib/useFetch";
import { Loader } from "components/Loader";

interface Props {
  citizen: Citizen | null;
}

export default function CitizenId({ citizen }: Props) {
  const { execute, state } = useFetch();
  const { isOpen, openModal, closeModal } = useModal();
  const router = useRouter();

  async function handleDelete() {
    if (!citizen) return;
    const data = await execute(`/citizen/${citizen.id}`, {
      method: "DELETE",
    });

    console.log({ data });

    if (data.json) {
      closeModal("deleteCitizen");
      router.push("/citizen");
    }
  }

  React.useEffect(() => {
    if (!citizen) {
      router.push("/404");
    }
  }, [router, citizen]);

  if (!citizen) {
    return null;
  }

  return (
    <Layout>
      <div className="card bg-gray-200/60 p-4 rounded-md flex items-start justify-between">
        <div className="flex flex-col sm:flex-row items-start">
          <button onClick={() => openModal("citizenImage")} className="cursor-pointer">
            <img
              className="rounded-full"
              src="https://yt3.ggpht.com/yJ9oovZC3P9YSil0Wjk7UgnYnLORTSwP_wFjAvqJ_m-z08zpTwll2rnWqYsXUVGb-Dlh_fqeaw=s88-c-k-c0x00ffffff-no-nd-rj"
            />
          </button>

          <div className="sm:ml-3 mt-2 sm:mt-0 flex flex-col">
            <p>
              <span className="font-semibold">Full name: </span>
              {citizen.fullName}
            </p>
            <p>
              <span className="font-semibold">Gender: </span>
              {citizen.gender}
            </p>
            <p>
              <span className="font-semibold">Ethnicity: </span>
              {citizen.ethnicity}
            </p>
            <p>
              <span className="font-semibold">Hair Color: </span>
              {citizen.hairColor}
            </p>
            <p>
              <span className="font-semibold">Eye Color: </span>
              {citizen.eyeColor}
            </p>
          </div>

          <div className="sm:ml-5 flex flex-col">
            <p>
              <span className="font-semibold">Weight: </span>
              {citizen.weight}
            </p>
            <p>
              <span className="font-semibold">Height: </span>
              {citizen.height}
            </p>
            <p>
              <span className="font-semibold">Address: </span>
              {citizen.address}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => router.push(`/citizen/${citizen.id}/edit`)}
            className="bg-green-500 hover:bg-green-600"
          >
            <Link href={`/citizen/${citizen.id}/edit`}>
              <a>Edit Citizen</a>
            </Link>
          </Button>
          <Button
            onClick={() => openModal("deleteCitizen")}
            className="bg-red-500 hover:bg-red-600"
          >
            Delete Citizen
          </Button>
        </div>
      </div>

      <Modal
        title={citizen.fullName}
        onClose={() => closeModal("citizenImage")}
        isOpen={isOpen("citizenImage")}
      >
        <div className="mt-10 flex items-center justify-center">
          <img
            className="rounded-full w-[20em] h-[20em]"
            src="https://yt3.ggpht.com/yJ9oovZC3P9YSil0Wjk7UgnYnLORTSwP_wFjAvqJ_m-z08zpTwll2rnWqYsXUVGb-Dlh_fqeaw=s88-c-k-c0x00ffffff-no-nd-rj"
          />
        </div>
        {/* todo: add ability to edit image from here */}
      </Modal>

      <Modal
        title="Delete Citizen"
        onClose={() => closeModal("deleteCitizen")}
        isOpen={isOpen("deleteCitizen")}
      >
        <p className="my-3">
          Are you sure you want to delete <span className="font-semibold">{citizen.fullName}</span>?
          This action cannot be undone.
        </p>
        <div className="mt-2 flex gap-2 items-center justify-end">
          <Button disabled={state === "loading"} onClick={() => closeModal("deleteCitizen")}>
            Cancel
          </Button>
          <Button
            disabled={state === "loading"}
            className="flex items-center bg-red-500 hover:bg-red-600"
            onClick={handleDelete}
          >
            {state === "loading" ? <Loader className="border-red-200 mr-2" /> : null} Delete
          </Button>
        </div>
      </Modal>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ query, req }) => {
  const { data } = await handleRequest<Citizen>(`/citizen/${query.id}`, {
    headers: req.headers,
  }).catch(() => ({ data: null }));

  return {
    props: {
      session: await getSessionUser(req.headers),
      citizen: data,
    },
  };
};
