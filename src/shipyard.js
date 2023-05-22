import { useContext, useEffect } from "react";
import { CallEndPoint, DataProvider, ENDPOINTS } from "./spaceAPI";
import "./styles/shipyard.css";

export default function ShipYard() {
	const { store, setStore } = useContext(DataProvider);
	useEffect(() => {}, []);
	return <>Ships... :construction:</>;
}
