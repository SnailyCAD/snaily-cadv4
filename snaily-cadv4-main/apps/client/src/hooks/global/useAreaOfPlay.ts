import * as React from "react";
import { useAuth } from "context/AuthContext";
import { useListener } from "@casperiv/use-socket.io";
import { SocketEvents } from "@snailycad/config";

export function useAreaOfPlay() {
  const { cad } = useAuth();
  const [aop, setAop] = React.useState(cad?.areaOfPlay ?? "");

  const showAop = cad?.features?.AOP ?? true;

  useListener(SocketEvents.UpdateAreaOfPlay, (aop: string | null) => {
    setAop(aop ?? "");
  });

  React.useEffect(() => {
    setAop(cad?.areaOfPlay ?? "");
  }, [cad?.areaOfPlay]);

  return { showAop, areaOfPlay: aop };
}
