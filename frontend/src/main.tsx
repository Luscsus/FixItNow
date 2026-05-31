import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";

import App from "./App.tsx";
import "./index.css";
import { ToastProvider } from "./components/ui/toast.tsx";
import { AuthProvider } from "./context/auth.tsx";
import { queryClient } from "./config/queryClient.ts";

if (import.meta.env.PROD) {
  registerSW({ immediate: true });
} else if ("serviceWorker" in navigator) {
  // Dev mode: proactively unregister any service worker left behind by a
  // previous `npm run preview` session. Without this, the cached production
  // build intercepts every fetch and the dev server (with HMR) is invisible
  // until the user manually wipes the SW from devtools. Safari especially
  // hides this control deep in the inspector, so we automate it.
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  });
}

const googleClientId: string = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? "";

const tree = (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {googleClientId ? (
      <GoogleOAuthProvider clientId={googleClientId}>
        {tree}
      </GoogleOAuthProvider>
    ) : (
      tree
    )}
  </StrictMode>,
);
