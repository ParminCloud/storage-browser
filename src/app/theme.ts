import { defineConfig, createSystem, defaultConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    semanticTokens: {
      colors: {
        "custom-teal-bg-color": {
          value: {
            _light: "var(--chakra-colors-gray-50)",
            _dark: "var(--chakra-colors-teal-950)",
          },
        },
      },
    },
    tokens: {
      fonts: {
        heading: { value: "var(--font-geist)" },
        body: { value: "var(--font-geist)" },
        mono: { value: "var(--font-geist-mono)" },
      },
    },
  },
  globalCss: {
    html: {
      colorPalette: "teal",
      bgColor: "custom-teal-bg-color",
    },
  },
});

export const system = createSystem(defaultConfig, config);
