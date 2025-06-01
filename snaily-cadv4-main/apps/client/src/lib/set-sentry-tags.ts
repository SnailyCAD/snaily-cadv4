import { setTag, setTags } from "@sentry/nextjs";
import type { cad } from "@snailycad/types";

export interface SetSentryTagsOptions {
  cad: cad | null;
  locale?: string;
  isMounted: boolean;
}

export function setSentryTags(options: SetSentryTagsOptions) {
  const timeZone = options.isMounted && tryToGetUserTimezone();

  if (timeZone) {
    setTag("snailycad.timezone", timeZone);
  }

  if (options.locale) {
    setTag("locale", options.locale);
  }

  if (options.cad?.version) {
    setTags({
      "snailycad.version": options.cad.version.currentVersion,
      "snailycad.commitHash": options.cad.version.currentCommitHash,
    });
  }
}

function tryToGetUserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return null;
  }
}
