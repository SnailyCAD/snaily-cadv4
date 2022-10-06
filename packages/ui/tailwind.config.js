// todo: export this config for the client

/** @type {import("tailwindcss").Config} */
module.exports = {
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: ["./src/**/*.tsx"],
  darkMode: "class",
  theme: {
    extend: {
      borderWidth: {
        DEFAULT: "1.5px",
      },
      screens: {
        nav: "900px",
      },
      colors: {
        primary: "#16151a",
        secondary: "#35343c",
        tertiary: "#1f1e26",
        quaternary: "#2f2e34",
        quinary: "#454349",
      },
      // https://github.com/timolins/react-hot-toast/blob/main/site/tailwind.config.js#L21
      animation: {
        enter: "enter 200ms ease-out",
        leave: "leave 150ms ease-in forwards",
      },
      keyframes: {
        enter: {
          "0%": { transform: "translateY(-4px)", opacity: 0 },
          "100%": { transform: "translateY(0px)", opacity: 1 },
        },
        leave: {
          "0%": { transform: "translateY(0px)", opacity: 1 },
          "100%": { transform: "translateY(-4px)", opacity: 0 },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
