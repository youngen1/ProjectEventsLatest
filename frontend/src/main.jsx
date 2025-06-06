import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import './index.css';
import { AuthProvider } from "./context/AuthContext.jsx";
import { LoadScript } from "@react-google-maps/api";

const libraries = ["places"];

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <LoadScript
        googleMapsApiKey="AIzaSyAsvpRyz_UMpIJ63M86Yj-oSEHZlCQlN0o"
        libraries={libraries}
        loadingElement={<div>Loading...</div>}
        onLoad={(data) => console.log("Google Maps Loaded", data)}
        onError={(err) => console.error("Error loading Google Maps", err)}
      >
        <App />
      </LoadScript>
    </AuthProvider>
  </React.StrictMode>
);
