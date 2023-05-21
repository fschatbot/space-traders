import "./styles/App.css";
import LogIn from "./log_in";
import { Route, Routes, Navigate } from "react-router-dom";
import { DataProvider, getToken } from "./spaceAPI";
import NavBar from "./Navbar";
import Ships from "./ships";
import { useState } from "react";

function App() {
	const [store, setStore] = useState({});

	return (
		<div className="App">
			<DataProvider.Provider value={{ store, setStore }}>
				<Routes>
					<Route path="/login" element={<LogIn />} />
					<Route
						path="/ships"
						element={
							<PageWrapper>
								<Ships />
							</PageWrapper>
						}
					/>
					<Route path="*" element={<Navigate to="/login" replace />} />
				</Routes>
			</DataProvider.Provider>
		</div>
	);
}

const PageWrapper = (props) => {
	if (!getToken()) return <Navigate to="/login" replace />;

	return (
		<>
			<NavBar />
			{props.children}
		</>
	);
};

export default App;
