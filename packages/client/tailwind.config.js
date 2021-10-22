module.exports = {
  mode: "jit",
  purge: ["./src/**/*.tsx"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "dark-gray": "#2f2f2f",
        "gray-2": "#212529",
        "gray-3": "#202428",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
