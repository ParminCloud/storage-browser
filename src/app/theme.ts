import { defineConfig, createSystem, defaultConfig } from "@chakra-ui/react"

const config = defineConfig({
  theme: {
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
      colorPalette: "teal", // Change this to any color palette you prefer
    },
  },
})


export const system = createSystem(defaultConfig, config)