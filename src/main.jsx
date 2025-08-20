import React from "react";
import ReactDOM from "react-dom/client"; // ya ReactDOM from "react-dom" (Vite me client wali syntax hoti hai)
import App from "./App";
import "./styles.css";   // CSS ko import karna yahan hota hai

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
