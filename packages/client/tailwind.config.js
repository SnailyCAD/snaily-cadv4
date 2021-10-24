module.exports = {
  mode: "jit",
  purge: ["./src/**/*.tsx"],
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
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
