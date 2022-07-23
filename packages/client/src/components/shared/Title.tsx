import { useAuth } from "context/AuthContext";
import { classNames } from "lib/classNames";
import Head from "next/head";

type Child = string | null | undefined;

interface Props {
  children: Child | Child[];

  /**
   * whether to render an h1 for the layout title
   * @default true
   */
  renderLayoutTitle?: boolean;

  className?: string;
}

export function Title({ children, renderLayoutTitle = true, className }: Props) {
  const { cad } = useAuth();
  const cadName = cad?.name ?? "SnailyCAD";

  if (!children) {
    children = "SnailyCAD";
  }

  if (Array.isArray(children)) {
    children = children.join(" ");
  }

  return (
    <>
      <Head>
        <title>{`${children} - ${cadName}`}</title>
        {cad?.miscCadSettings?.cadOGDescription ? (
          <>
            <meta name="description" content={cad?.miscCadSettings?.cadOGDescription} />
            <meta name="og:description" content={cad?.miscCadSettings?.cadOGDescription} />
          </>
        ) : null}
        <meta name="og:title" content={`${children} - ${cadName}`} />
      </Head>

      {renderLayoutTitle ? (
        <h1 className={classNames("text-3xl font-semibold mb-3", className)}>{children}</h1>
      ) : null}
    </>
  );
}
