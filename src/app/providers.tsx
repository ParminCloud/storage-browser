"use client";

import { Provider } from "@/components/ui/provider"
import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return <Provider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </Provider>
}
