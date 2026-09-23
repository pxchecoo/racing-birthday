import { lazy, StrictMode, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/barlow-condensed/latin-600.css";
import "./styles/index.css";
const isAdmin = [
  `${import.meta.env.BASE_URL}admin`,
  `${import.meta.env.BASE_URL}admin/index.html`,
].includes(window.location.pathname.replace(/\/$/, ""));
const Page = isAdmin
  ? lazy(() => import("./pages/Admin"))
  : lazy(() => import("./App"));
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Suspense
      fallback={
        <div
          role="status"
          aria-label="Loading"
          style={{ minHeight: "100svh", background: "#08090b" }}
        />
      }
    >
      <Page />
    </Suspense>
  </StrictMode>,
);
