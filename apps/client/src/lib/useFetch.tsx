import * as React from "react";
import type { AxiosRequestConfig } from "axios";
import { useTranslations } from "use-intl";
import type { FormikHelpers } from "formik";
import { toastMessage } from "./toastMessage";
import { useModal } from "../state/modalState";
import { ModalIds } from "../types/ModalIds";
import { useAuth } from "../context/AuthContext";
import { getNextI18nConfig } from "./i18n/getNextI18nConfig";
import {
  ErrorMessage,
  ErrorResponseData,
  getErrorObj,
  getFeatureNotEnabledError,
  isAxiosError,
  isErrorKey,
  parseError,
  parseErrors,
  parseErrorTitle,
} from "./fetch/errors";
import { getAPIUrl } from "@snailycad/utils/api-url";

interface UseFetchOptions {
  overwriteState: State | null;
}

type NullableAbortController = AbortController | null;
type State = "loading" | "error";

type Options<Helpers extends object = object> = AxiosRequestConfig & {
  path: string;
  noToast?: boolean | ErrorMessage | (string & {});
  helpers?: FormikHelpers<Helpers>;
};

interface Return<Data> {
  json: Data;
  error: null | ErrorMessage | (string & {});
}

let config: Awaited<ReturnType<typeof getNextI18nConfig>> | undefined;
let handleRequest: typeof import("./fetch").handleRequest | undefined;

export default function useFetch({ overwriteState }: UseFetchOptions = { overwriteState: null }) {
  const [state, setState] = React.useState<State | null>(null);
  const { openModal } = useModal();
  const { user } = useAuth();

  const t = useTranslations("Errors");
  const abortControllerRef = React.useRef<NullableAbortController>(null);

  React.useEffect(() => {
    setState(overwriteState);
  }, [overwriteState]);

  async function execute<Data, Helpers extends object = object>(
    options: Options<Helpers>,
  ): Promise<Return<Data>> {
    if (!config) {
      config = await getNextI18nConfig();
    }

    if (!handleRequest) {
      handleRequest = (await import("./fetch")).handleRequest;
    }

    setState("loading");
    const locale = user?.locale ?? config.defaultLocale;

    abortControllerRef.current = new AbortController();
    const { path, ...restOptions } = options;

    const mergedOptions = { ...restOptions, signal: abortControllerRef.current.signal };

    const response = await handleRequest(path, { ...mergedOptions }).catch((e) => {
      setState("error");
      return e;
    });

    const error = isAxiosError<ErrorResponseData | null>(response) ? parseError(response) : null;

    if (error) {
      const errors = parseErrors(response);
      const errorTitle = parseErrorTitle(response);

      const errorMessages = (await import(`../../locales/${locale}/common.json`)).Errors;

      const hasKey = isErrorKey(error, errorMessages);
      const key = hasKey ? error : "unknown";
      const errorObj = getErrorObj(response);

      console.error(JSON.stringify({ DEBUG: errorObj }, null, 2));

      if (response?.response?.status === 401) {
        openModal(ModalIds.ReauthorizeSession);
      }

      if (error === "noActiveOfficer") {
        openModal(ModalIds.SelectOfficer, { includeStatuses: true });
      }

      let hasAddedError = false as boolean; // as boolean because eslint gets upset otherwise.
      if (options.helpers) {
        for (const error of errors) {
          Object.entries(error).map(([key, value]) => {
            const translationOptions = typeof value === "string" ? undefined : value.data;
            const translationKey = typeof value === "string" ? value : value.message;

            const message = isErrorKey(translationKey, errorMessages)
              ? t(translationKey, translationOptions)
              : translationKey;

            if (message && restOptions.helpers) {
              restOptions.helpers.setFieldError(key, message);
              hasAddedError = true;
            }
          });
        }
      }

      const featureNotEnabledOptions = getFeatureNotEnabledError(response);
      const translationOptions = featureNotEnabledOptions?.data ?? undefined;
      const translationKey = featureNotEnabledOptions?.message ?? key;
      const apiUrl = getAPIUrl();

      const message = isErrorKey(key, errorMessages)
        ? t.rich(translationKey, {
            ...translationOptions,
            span: (children) => <span className="font-medium">{children}</span>,
            p: (children) => <p className="first:mt-2">{children}</p>,
            clientURL: process.env.NEXT_PUBLIC_CLIENT_URL,
            apiURL: apiUrl,
            currentURL: window.location.href,
          })
        : key;

      if (
        typeof restOptions.noToast === "string" &&
        restOptions.noToast !== error &&
        !hasAddedError
      ) {
        toastMessage({ message, title: `${errorTitle} ${error ? `(${error})` : ""}` });
      } else if (!restOptions.noToast && !hasAddedError) {
        toastMessage({ message, title: `${errorTitle} ${error ? `(${error})` : ""}` });
      }

      setState("error");

      return {
        json: {} as Data,
        error: isAxiosError<ErrorResponseData | null>(response) ? parseError(response) : null,
      };
    }

    setState(null);

    return {
      json: response?.data ?? {},
      error: null,
    };
  }

  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { execute, state };
}
