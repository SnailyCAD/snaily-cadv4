import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import path from "node:path";

export default defineConfig({
  plugins: [react(), dts({})],
  build: {
    lib: {
      formats: ["es"],
      entry: path.resolve(__dirname, "src/index.tsx"),
      name: "@snailycad/ui",
      fileName: () => "index.mjs",
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled into your library
      external: [
        "react",
        "react-bootstrap-icons",
        "next-intl",
        "next/link",
        "@react-aria/button",
        "@react-aria/breadcrumbs",
        "@react-aria/dialog",
        "@react-aria/focus",
        "@react-aria/interactions",
        "@react-aria/label",
        "@react-aria/listbox",
        "@react-aria/menu",
        "@react-aria/overlays",
        "@react-aria/progress",
        "@react-aria/radio",
        "@react-aria/textfield",
        "@react-aria/utils",
        "@react-stately/collections",
        "@react-stately/list",
        "@react-stately/menu",
        "@react-stately/radio",
        "@react-stately/select",
        "tailwind-merge",
      ],
    },
  },
});
