import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import LoginGate from "./components/LoginGate.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <LoginGate>
    <App />
  </LoginGate>
);
