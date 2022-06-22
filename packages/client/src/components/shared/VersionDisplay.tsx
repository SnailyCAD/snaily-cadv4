import type { cad } from "@snailycad/types";

interface Props {
  cad: Pick<cad, "version"> | null;
}

export function VersionDisplay({ cad }: Props) {
  if (!cad?.version) {
    return null;
  }

  const releaseURL = `https://github.com/SnailyCAD/snaily-cadv4/releases/tag/${cad.version.currentVersion}`;
  const commitURL = `https://github.com/SnailyCAD/snaily-cadv4/commit/${cad.version.currentCommitHash}`;
  return (
    <p className="text-gray-900 dark:text-gray-200 block mt-3 text-base z-50">
      <Link href={releaseURL}>v{cad.version.currentVersion}</Link> {"—"}{" "}
      <Link href={commitURL}>{cad.version.currentCommitHash}</Link>
    </p>
  );
}

function Link(props: JSX.IntrinsicElements["a"]) {
  return (
    <a
      {...props}
      className="underline text-neutral-800 dark:text-gray-400 mx-2"
      target="_blank"
      rel="noopener noreferrer"
    />
  );
}
