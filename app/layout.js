import "./globals.css";
import { DialogProvider } from "@/components/DialogProvider";
import SessionStorageBridge from "@/components/SessionStorageBridge";
import { ReactLenis } from 'lenis/react';

export const metadata = {
  title: "MedExam Portal | Gamified Medical Assessment Platform",
  description: "A premium, gamified exam portal designed for medical students to practice simulative papers, NEET PG, FMGE, and university courses.",
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
