"use client";

import { Toaster } from "@/components/ui/toaster";
import { ColorModeProvider } from "@/components/ui/color-mode";
import { ChakraProvider } from "@chakra-ui/react";
import { system } from "./theme";
export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider>
        {props.children}
        <Toaster />
      </ColorModeProvider>
    </ChakraProvider>
  );
}
