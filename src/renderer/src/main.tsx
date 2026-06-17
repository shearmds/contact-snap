import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "sonner";
import { HomeView } from "./home-view";
import "./styles/globals.css";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <div className="h-screen flex flex-col bg-background text-foreground">
      <HomeView />
    </div>
    <Toaster position="bottom-center" richColors />
  </React.StrictMode>,
);
