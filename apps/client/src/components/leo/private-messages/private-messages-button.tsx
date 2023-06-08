import { useListener } from "@casper124578/use-socket.io";
import { SocketEvents } from "@snailycad/config";
import { DispatchChat } from "@snailycad/types";
import { Button } from "@snailycad/ui";
import { useQuery } from "@tanstack/react-query";
import useFetch from "lib/useFetch";
import { ActiveDeputy } from "state/ems-fd-state";
import { ActiveOfficer } from "state/leo-state";
import { useModal } from "state/modalState";
import { ModalIds } from "types/ModalIds";

interface Props {
  unit: ActiveDeputy | ActiveOfficer;
}

export function PrivateMessagesButton(props: Props) {
  const { openModal } = useModal();
  const { execute } = useFetch();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["private-messages-count", props.unit.id],
    queryFn: async () => {
      const { json } = await execute<DispatchChat[]>({
        path: `/dispatch/private-message/${props.unit.id}`,
        method: "GET",
      });

      return Array.isArray(json) ? json : [];
    },
  });

  useListener(
    SocketEvents.PrivateMessage,
    (data: { chat: DispatchChat; unitId: string }) => {
      if (data.unitId === props.unit?.id) {
        refetch();
      }
    },
    [props.unit?.id],
  );

  if (isLoading) {
    return <Button isDisabled className="animate-pulse rounded-md w-40 h-8 opacity-80" size="sm" />;
  }

  return (
    <Button
      className="grid place-content-center w-fit h-8"
      onPress={() => openModal(ModalIds.PrivateMessage, props.unit)}
      isDisabled={!data?.length}
    >
      {data?.length ?? 0} available
    </Button>
  );
}
