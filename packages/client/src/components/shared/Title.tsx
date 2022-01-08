import { useAuth } from "context/AuthContext";
import Head from "next/head";

type Child = string | null | undefined;

interface Props {
  children: Child | Child[];
}

export function Title({ children }: Props) {
  const { cad } = useAuth();
  const cadName = cad?.name ?? "SnailyCAD";

  if (!children) {
    children = "SnailyCAD";
  }

  if (Array.isArray(children)) {
    children = children.join(" ");
  }

  return (
    <Head>
      <title>
        {children} - {cadName}
      </title>
      <meta name="og:title" content={`${children} - ${cadName}`} />
    </Head>
  );
}
