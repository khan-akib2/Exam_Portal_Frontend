import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DialogProvider } from "@/components/DialogProvider";
import SessionStorageBridge from "@/components/SessionStorageBridge";
import { ReactLenis } from '@studio-freight/react-lenis';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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
