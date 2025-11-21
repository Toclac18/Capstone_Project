// src/app/layout.tsx
import "@/css/satoshi.css";
import "@/css/style.css";
import "flatpickr/dist/flatpickr.min.css";

import ConditionalLayout from "@/app/ConditionalLayout";
import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";

import { ModalPreviewProvider, ModalPreview } from "@/components/ModalPreview";
import { AlertDialogProvider } from "@/hooks/useAlertDialog";

export const metadata: Metadata = {
  title: {
    template: "%s | Readee",
    default: "Readee",
  },
  description:
    "Next.js admin dashboard toolkit with 200+ templates, UI components, and integrations for fast dashboard development.",
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AlertDialogProvider>
          <ModalPreviewProvider>
            <Providers>
              <NextTopLoader color="#5750F1" showSpinner={false} />

              <ConditionalLayout>{children}</ConditionalLayout>
            </Providers>

            <ModalPreview />
          </ModalPreviewProvider>
        </AlertDialogProvider>
      </body>
    </html>
  );
}
