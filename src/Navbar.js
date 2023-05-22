import { ENDPOINTS, CallEndPoint, DataProvider } from "./spaceAPI";
import { NavLink } from "react-router-dom";
import "./styles/navbar.css";
import { useContext, useEffect, useState } from "react";

export default function NavBar() {
	const { store, updateStore } = useContext(DataProvider);
	useEffect(() => {
		if (!store.name) CallEndPoint({ endpoint: ENDPOINTS.AGENT_DATA }).then((response) => updateStore({ name: response.data.symbol }));
	}, []);

	return (
		<div className="navbar">
			<NavLink to="/ships" className={({ isActive }) => (isActive ? "active" : "")}>
				Ships
			</NavLink>
			<NavLink to="/contracts" className={({ isActive }) => (isActive ? "active" : "")}>
				Contracts
			</NavLink>
			<NavLink to="/shipyard" className={({ isActive }) => (isActive ? "active" : "")}>
				Shipyard
			</NavLink>
			<NavLink to="/market-place" className={({ isActive }) => (isActive ? "active" : "")}>
				Market Place
			</NavLink>
			<NavLink to="/map" className={({ isActive }) => (isActive ? "active" : "")}>
				Map
			</NavLink>
			<span className="name">{store.name}</span>
		</div>
	);
}