import * as React from "react";
import { useTranslations } from "use-intl";

interface Props {
  toggled: boolean;
  onClick: (value: any) => void;
  name: string;
}

enum Directions {
  RIGHT = 0,
  LEFT = 100,
}

export const Toggle = ({ toggled, name, onClick }: Props) => {
  const [x, setX] = React.useState(() => getDirection(toggled));
  const t = useTranslations("Common");

  React.useEffect(() => {
    setX(getDirection(toggled));
  }, [toggled]);

  return (
    <div className="w-[100px] bg-gray-200 flex items-center justify-between rounded-lg relative overflow-hidden">
      <div
        style={{ transform: `translateX(${x}%)` }}
        className="absolute bg-dark-gray h-8 w-1/2 pointer-events-none transition-all duration-200"
      />

      <button
        onClick={() => onClick({ target: { name, value: true } })}
        type="button"
        className={`w-full p-1 cursor-pointer pointer-events-auto z-10  ${
          toggled && "text-white font-semibold"
        }`}
      >
        {t("on")}
      </button>
      <button
        onClick={() => onClick({ target: { name, value: false } })}
        type="button"
        className={`w-full p-1 cursor-pointer pointer-events-auto z-10  ${
          !toggled && "text-white font-semibold"
        }`}
      >
        {t("off")}
      </button>
    </div>
  );
};

function getDirection(toggled: boolean) {
  if (toggled === true) {
    return Directions.RIGHT;
  }

  return Directions.LEFT;
}
