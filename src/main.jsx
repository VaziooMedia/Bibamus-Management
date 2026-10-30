import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { installNoAutocorrect } from "./noAutocorrect.js";

// Aucune correction automatique dans les champs de saisie (voir noAutocorrect.js).
installNoAutocorrect();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
