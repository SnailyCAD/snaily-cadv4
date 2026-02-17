import * as React from "react";
import { Modal } from "components/modal/Modal";
import { useAuth } from "context/AuthContext";
import { useModal } from "state/modalState";
import { ModalIds } from "types/modal-ids";
import { Loader } from "@snailycad/ui";
import ReactMarkdown from "react-markdown";
import remarkGithub from "remark-github";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import { remarkGitHubReferences } from "lib/editor/remarkGitHubReferences";
import useFetch from "lib/useFetch";
import remarkExternalLinks from "remark-external-links";
import { useQuery } from "@tanstack/react-query";

export function ChangelogModal() {
  const modalState = useModal();
  const { cad } = useAuth();
  const { execute } = useFetch();

  const { data, error, isPending } = useQuery<string, Error, string>({
    refetchOnWindowFocus: false,
    queryKey: ["changelog"],
    queryFn: async () => {
      const { json } = await execute<string>({
        path: "/admin/changelog",
      });

      if (json) {
        return json;
      }

      throw new Error("unable to fetch changelog");
    },
  });

  return (
    <Modal
      className="w-[800px]"
      title={`What's New in ${cad?.version?.currentVersion}`}
      isOpen={modalState.isOpen(ModalIds.Changelog)}
      onClose={() => modalState.closeModal(ModalIds.Changelog)}
    >
      {isPending ? (
        <div className="mt-5 grid place-content-center h-40">
          <Loader className="w-7 h-7" />
        </div>
      ) : !data || error ? (
        (error?.message ?? "Unable to fetch changelog")
      ) : (
        <ReactMarkdown
          remarkPlugins={[
            remarkGfm,
            [remarkGithub, { repository: "SnailyCAD/snaily-cadv4" }],
            remarkGitHubReferences,
            remarkEmoji,
            // @ts-expect-error - remark-external-links doesn't have updated types
            remarkExternalLinks,
          ]}
          className="prose dark:prose-invert"
        >
          {data}
        </ReactMarkdown>
      )}
    </Modal>
  );
}
