import * as React from "react";
import { Modal } from "components/modal/Modal";
import { useAuth } from "context/AuthContext";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";
import { Loader } from "@snailycad/ui";
import ReactMarkdown from "react-markdown";
import remarkGithub from "remark-github";
import remarkGfm from "remark-gfm";
import remarkEmoji from "remark-emoji";
import { remarkGitHubReferences } from "lib/editor/remarkGitHubReferences";
import useFetch from "lib/useFetch";

export function ChangelogModal() {
  const { isOpen, closeModal } = useModal();
  const { cad } = useAuth();
  const [body, setBody] = React.useState<string | null>(null);
  const { state, execute } = useFetch();

  const fetchLatestChangelog = React.useCallback(async () => {
    if (body) return;

    const { json } = await execute<{ body: string }>({
      path: "/admin/changelog",
    });

    if (json) {
      setBody(typeof json === "string" ? json : json.body);
    }
  }, [cad?.version?.currentVersion, body]); // eslint-disable-line react-hooks/exhaustive-deps

  React.useEffect(() => {
    fetchLatestChangelog();
  }, [fetchLatestChangelog]);

  return (
    <Modal
      className="w-[800px]"
      title={`What's New in ${cad?.version?.currentVersion}`}
      isOpen={isOpen(ModalIds.Changelog)}
      onClose={() => closeModal(ModalIds.Changelog)}
    >
      {!body || state === "loading" ? (
        <div className="mt-5 grid place-content-center h-40">
          <Loader className="w-7 h-7" />
        </div>
      ) : (
        <ReactMarkdown
          linkTarget="_blank"
          remarkPlugins={[
            remarkGfm,
            [remarkGithub, { repository: "SnailyCAD/snaily-cadv4" }],
            remarkGitHubReferences,
            remarkEmoji,
          ]}
          className="prose prose-2xl dark:prose-invert"
        >
          {body}
        </ReactMarkdown>
      )}
    </Modal>
  );
}
