import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));

// React Strict Mode is removed as it would make double requests to the server
root.render(
	<BrowserRouter>
		<App />
	</BrowserRouter>
);
