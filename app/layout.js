import "./globals.css";
import { DialogProvider } from "@/components/DialogProvider";
import SessionStorageBridge from "@/components/SessionStorageBridge";
import { ReactLenis } from 'lenis/react';

export const metadata = {
  title: "MedAssess Pro | World-Class Medical Examination Platform",
  description: "Assessment Infrastructure for Medical Excellence. A premium medical examination platform.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <ReactLenis root>
        <body className="min-h-full flex flex-col">
          <SessionStorageBridge />
          <DialogProvider>
            {children}
          </DialogProvider>
        </body>
      </ReactLenis>
    </html>
  );
}
