import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import AlarmScreen from "./AlarmScreen.jsx";

function Root() {
  const [showAlarm, setShowAlarm] = useState(import.meta.env.DEV ? window.location.search.includes("alarm=true") : true);

  return (
    <>
      {showAlarm ? (
        <AlarmScreen onDismiss={() => setShowAlarm(false)} />
      ) : (
        <App />
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
