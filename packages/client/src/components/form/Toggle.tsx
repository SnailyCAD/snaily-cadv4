import * as React from "react";
import { useTranslations } from "use-intl";

interface Props {
  toggled: boolean;
  onClick: (value: any) => void;
  name: string;
  text?: "enable/disable" | "on/off";
}

enum Directions {
  RIGHT = 0,
  LEFT = 100,
}

export const Toggle = ({ toggled, name, text = "on/off", onClick }: Props) => {
  const [x, setX] = React.useState(() => getDirection(toggled));
  const t = useTranslations("Common");

  const trueText = text === "on/off" ? t("on") : t("enabled");
  const falseText = text === "on/off" ? t("off") : t("disabled");

  React.useEffect(() => {
    setX(getDirection(toggled));
  }, [toggled]);

  return (
    <div
      className={`w-[100px] ${
        text === "enable/disable" && "w-1/4 min-w-[206px]"
      } bg-gray-200 flex items-center justify-between rounded-lg relative overflow-hidden`}
    >
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
        {trueText}
      </button>
      <button
        onClick={() => onClick({ target: { name, value: false } })}
        type="button"
        className={`w-full p-1 cursor-pointer pointer-events-auto z-10  ${
          !toggled && "text-white font-semibold"
        }`}
      >
        {falseText}
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
