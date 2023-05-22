import { useContext, useEffect } from "react";
import { CallEndPoint, DataProvider, ENDPOINTS } from "./spaceAPI";
import "./styles/ships.css";

export default function Ships() {
	const { store, setStore } = useContext(DataProvider);
	useEffect(() => {}, []);
	return <>Ships... :construction:</>;
}
