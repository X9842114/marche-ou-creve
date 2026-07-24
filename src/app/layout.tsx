import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { InteractiveNeuralVortexBackground } from "@/components/ui/interactive-neural-vortex-background";
import "./globals.css";

export const metadata: Metadata = {
  title: "Marche ou creve H-47",
  description:
    "L'événement de survie le plus impitoyable de Los Santos. Inscris-toi, marche… ou crève.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark h-full antialiased" suppressHydrationWarning>
      <body className="moc-body flex min-h-full flex-col bg-[#050008] text-foreground">
        <InteractiveNeuralVortexBackground />
        <div className="relative z-10 flex min-h-screen flex-1 flex-col">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
