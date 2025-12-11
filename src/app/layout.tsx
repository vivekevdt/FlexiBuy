// app/layout.tsx
import "./globals.css";
import { CartProvider } from "./contexts/cartContexts";
import ClientAppShell from "@/components/ClientAppShell";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          <ClientAppShell>{children}</ClientAppShell>
        </CartProvider>
      </body>
    </html>
  );
}
