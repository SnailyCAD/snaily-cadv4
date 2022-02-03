import { Button } from "components/Button";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/inputs/Input";
import { Loader } from "components/Loader";
import { useAuth } from "context/AuthContext";
import { Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import type { User } from "@snailycad/types";
import { useTranslations } from "use-intl";
import { BAN_SCHEMA } from "@snailycad/schemas";

interface Props {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export function BanArea({ user, setUser }: Props) {
  const common = useTranslations("Common");
  const { state, execute } = useFetch();
  const { user: session } = useAuth();

  const formDisabled = user.rank === "OWNER" || user.id === session?.id;

  async function onSubmit(values: { reason: string }) {
    if (formDisabled) return;

    const { json } = await execute(`/admin/manage/users/${user.id}/ban`, {
      method: "POST",
      data: values,
    });

    if (json.id) {
      setUser({ ...user, ...json });
    }
  }

  async function handleUnban() {
    if (formDisabled) return;

    const { json } = await execute(`/admin/manage/users/${user.id}/unban`, {
      method: "POST",
    });

    if (json.id) {
      setUser({ ...user, ...json });
    }
  }

  const validate = handleValidate(BAN_SCHEMA);

  return (
    <div className="p-3 mt-10 bg-gray-200 rounded-md dark:bg-gray-2">
      <h1 className="text-2xl font-semibold">Ban area</h1>

      {user.banned && user.rank !== "OWNER" ? (
        <div className="mt-1">
          <p>
            <span className="font-semibold">Ban Reason: </span> {user.banReason}
          </p>

          <Button
            className="flex items-center mt-2"
            disabled={state === "loading"}
            onClick={handleUnban}
          >
            {state === "loading" ? <Loader className="mr-3" /> : null}
            Unban
          </Button>
        </div>
      ) : (
        <Formik validate={validate} onSubmit={onSubmit} initialValues={{ reason: "" }}>
          {({ handleChange, handleSubmit, values, errors }) => (
            <form className="mt-3" onSubmit={handleSubmit}>
              <FormField errorMessage={errors.reason} label={common("reason")}>
                <Input
                  className="bg-gray-100"
                  value={values.reason}
                  onChange={handleChange}
                  name="reason"
                  disabled={formDisabled}
                />
              </FormField>

              <Button
                className="flex items-center"
                type="submit"
                disabled={formDisabled || state === "loading"}
                variant="danger"
              >
                {state === "loading" ? <Loader className="mr-3 border-red-300" /> : null}
                Ban User
              </Button>
            </form>
          )}
        </Formik>
      )}
    </div>
  );
}
