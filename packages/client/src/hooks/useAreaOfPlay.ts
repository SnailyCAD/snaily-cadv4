import * as React from "react";
import { useAuth } from "context/AuthContext";

export function useAreaOfPlay() {
  const { cad } = useAuth();
  const [aop, setAop] = React.useState(cad?.areaOfPlay ?? "");

  const showAop = !cad?.disabledFeatures.includes("AOP");

  React.useEffect(() => {
    setAop(cad?.areaOfPlay ?? "");
  }, [cad?.areaOfPlay]);

  return { showAop, areaOfPlay: aop };
}
