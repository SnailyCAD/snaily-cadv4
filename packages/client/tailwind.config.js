module.exports = {
  content: ["./src/**/*.tsx"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "dark-bg": "#1F2023",
        "dark-gray": "#2f2f2f",
        "gray-2": "#27282B",
        "gray-3": "#303236",
        "gray-4": "#2D2E31",
        "dark-bright": "#2D2F36",
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
};
