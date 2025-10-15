"use client"

import { Toaster } from "@/components/ui/toaster";
import { ColorModeProvider } from "@/components/ui/color-mode"
import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={defaultSystem}>
      <ColorModeProvider>
        {props.children}
        <Toaster />
      </ColorModeProvider>
    </ChakraProvider>
  )
}

