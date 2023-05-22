import "./styles/App.css";
import LogIn from "./log_in";
import { Route, Routes, Navigate } from "react-router-dom";
import { DataProvider, getToken } from "./spaceAPI";
import NavBar from "./Navbar";
import Ships from "./ships";
import { useState } from "react";
import Contracts from "./contracts";
import ShipYard from "./shipyard";

function App() {
	const [store, setStore] = useState({});
	function updateStore(newStore) {
		setStore((prev) => ({ ...prev, ...newStore }));
	}

	return (
		<div className="App">
			<DataProvider.Provider value={{ store, setStore, updateStore }}>
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
					<Route
						path="/contracts"
						element={
							<PageWrapper>
								<Contracts />
							</PageWrapper>
						}
					/>
					<Route
						path="/shipyard"
						element={
							<PageWrapper>
								<ShipYard />
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
			<div className="PageContainer">{props.children}</div>
		</>
	);
};

export default App;
