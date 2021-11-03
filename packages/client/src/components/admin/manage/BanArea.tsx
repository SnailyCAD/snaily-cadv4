import { Button } from "components/Button";
import { Error } from "components/form/Error";
import { FormField } from "components/form/FormField";
import { Input } from "components/form/Input";
import { Loader } from "components/Loader";
import { useAuth } from "context/AuthContext";
import { Formik } from "formik";
import { handleValidate } from "lib/handleValidate";
import useFetch from "lib/useFetch";
import { User } from "types/prisma";
import { useTranslations } from "use-intl";
import { BAN_SCHEMA } from "@snailycad/schemas";

interface Props {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const BanArea = ({ user, setUser }: Props) => {
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
    <div className="bg-gray-200 dark:bg-gray-2 mt-10 rounded-md p-3">
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
              <FormField fieldId="reason" label={common("reason")}>
                <Input
                  hasError={!!errors.reason}
                  className="bg-gray-100"
                  value={values.reason}
                  onChange={handleChange}
                  id="reason"
                  disabled={formDisabled}
                />
                <Error>{errors.reason} </Error>
              </FormField>

              <Button
                className="flex items-center"
                type="submit"
                disabled={formDisabled || state === "loading"}
                variant="danger"
              >
                {state === "loading" ? <Loader className="border-red-300 mr-3" /> : null}
                Ban User
              </Button>
            </form>
          )}
        </Formik>
      )}
    </div>
  );
};
