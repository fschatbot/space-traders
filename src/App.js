import "./App.css";
import LogIn from "./log_in";
import { Route, Routes, Navigate } from "react-router-dom";
import { getToken } from "./spaceAPI";
import NavBar from "./Navbar";
import Ships from "./ships";

function App() {
	return (
		<div className="App">
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
