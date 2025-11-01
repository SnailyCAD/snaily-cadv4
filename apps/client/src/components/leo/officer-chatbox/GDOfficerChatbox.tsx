import * as React from "react";
import { Button, TextField, Loader } from "@snailycad/ui";
import { Form, Formik, type FormikHelpers } from "formik";
import { useTranslations } from "use-intl";
import { useQuery } from "@tanstack/react-query";
import useFetch from "lib/useFetch";
import { useGenerateCallsign } from "hooks/useGenerateCallsign";
import { makeUnitName } from "lib/utils";
import { SocketEvents } from "@snailycad/config";
import { useListener } from "@casperiv/use-socket.io";
import { ChevronDown, ChatSquare } from "react-bootstrap-icons";
import { cn } from "mxcn";
import { useLeoState } from "state/leo-state";
import { ShouldDoType } from "@snailycad/types";

interface OfficerChatMessage {
  id: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  message: string;
  creator: {
    unit: any;
  };
}

const INITIAL_VALUES = {
  message: "",
};

export function GDOfficerChatbox() {
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [messages, setMessages] = React.useState<OfficerChatMessage[]>([]);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
  const { execute, state } = useFetch();
  const { generateCallsign } = useGenerateCallsign();
  const t = useTranslations("Leo");
  const activeOfficer = useLeoState((state) => state.activeOfficer);

  const isOfficerOnDuty =
    activeOfficer !== null &&
    activeOfficer.status !== null &&
    activeOfficer.status.shouldDo !== ShouldDoType.SET_OFF_DUTY;

  const { isLoading } = useQuery({
    queryKey: ["officer-chat"],
    queryFn: async () => {
      const { json } = await execute<OfficerChatMessage[]>({
        path: "/leo/officer-chat",
        method: "GET",
      });

      const array = Array.isArray(json) ? json : [];
      setMessages(array);

      return array;
    },
    enabled: isOfficerOnDuty,
  });

  useListener(
    SocketEvents.OfficerChat,
    (data: OfficerChatMessage) => {
      if (!isOfficerOnDuty) return;
      setMessages((prev) => {
        if (prev.some((v) => v.id === data.id)) return prev;
        return [...prev, data];
      });
    },
    [isOfficerOnDuty],
  );

  React.useEffect(() => {
    if (!isOfficerOnDuty) return;
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOfficerOnDuty]);

  // Don't render if officer is not on duty
  if (!isOfficerOnDuty) {
    return null;
  }

  async function onSubmit(
    values: typeof INITIAL_VALUES,
    helpers: FormikHelpers<typeof INITIAL_VALUES>,
  ) {
    const { json } = await execute<OfficerChatMessage, typeof INITIAL_VALUES>({
      path: "/leo/officer-chat",
      method: "POST",
      data: values,
      helpers,
    });

    if (json.id) {
      helpers.resetForm();
    }
  }

  // allow users to press "Enter + Ctrl" or "Enter + Cmd" to send
  function handleCtrlEnter(event: React.KeyboardEvent<HTMLTextAreaElement>, submitForm: any) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      submitForm();
    }
  }

  if (isMinimized) {
    return (
      <button
        type="button"
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-colors"
        aria-label="Open officer chat"
      >
        <ChatSquare className="w-6 h-6" />
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
            {messages.length > 9 ? "9+" : messages.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 bg-white dark:bg-tertiary border border-secondary rounded-lg shadow-xl",
        "w-[400px] max-w-[calc(100vw-2rem)] flex flex-col",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-secondary">
        <h3 className="font-semibold text-lg text-gray-500 dark:text-white">Officer Chat</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-gray-200 dark:hover:bg-secondary text-gray-500 dark:text-white rounded transition-colors"
            aria-label="Minimize chat"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[400px] min-h-[300px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader />
          </div>
        ) : messages.length <= 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center mt-4">{t("noMessages")}</p>
        ) : (
          messages.map((message) => {
            const unit = message.creator.unit;
            if (!unit) return null;

            const isCombinedUnit = "officers" in unit && Array.isArray(unit.officers);
            const templateId = isCombinedUnit ? "pairedUnitTemplate" : "callsignTemplate";
            const callsign = generateCallsign(unit, templateId);
            const unitName = makeUnitName(unit);

            return (
              <div
                key={message.id}
                className="bg-gray-100 dark:bg-secondary rounded-lg p-2 break-words"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-gray-500 dark:text-white">
                    {callsign} {unitName}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(message.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-white">{message.message}</p>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="border-t border-secondary p-3">
        <Formik onSubmit={onSubmit} initialValues={INITIAL_VALUES}>
          {({ values, setFieldValue, submitForm }) => (
            <Form>
              <TextField
                value={values.message}
                onChange={(value) => setFieldValue("message", value)}
                placeholder={t("message")}
                isTextarea
                onKeyDown={(e) => handleCtrlEnter(e, submitForm)}
                className="mb-2"
                label=""
              />
              <Button
                disabled={state === "loading" || !values.message.trim()}
                className="w-full flex items-center justify-center"
                type="submit"
              >
                {state === "loading" ? <Loader className="mr-2 border-red-200" /> : null}
                {t("send")}
              </Button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
