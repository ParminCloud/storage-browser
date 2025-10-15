import Provider from "./provider"
import { Geist, Geist_Mono } from "next/font/google"

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html suppressHydrationWarning className={[geist.variable, geistMono.variable].join(" ")} lang="en">
      <head />
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  )
}
