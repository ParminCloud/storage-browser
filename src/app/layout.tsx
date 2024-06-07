import { Providers } from "./providers";

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>ParminCloud Storage Browser</title>
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
