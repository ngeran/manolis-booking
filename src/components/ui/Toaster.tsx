"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      toastOptions={{
        style: {
          background: "#0E0E0E",
          border: "1px solid #003642",
          color: "#fff",
          fontFamily: "'Inter', sans-serif",
          borderRadius: "0px",
        },
      }}
    />
  );
}
