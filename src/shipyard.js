import { useContext, useEffect, useRef, useState } from "react";
import { CallEndPoint, DataProvider, ENDPOINTS } from "./spaceAPI";
import "./styles/shipyard.css";

export default function ShipYard() {
	const { store, updateStore } = useContext(DataProvider);
	const searchRef = useRef();
	const [systems, setSystems] = useState([]);

	useEffect(() => {
		search();
	}, [searchRef.current]);

	function search() {
		if (!searchRef.current.value) {
			// Show recommended systems based on contracts
			let systems = store.contracts.map((a) => a.terms.deliver.map((objective) => objective.destinationSymbol.split("-").splice(0, 2).join("-"))).flat();
			systems = [...new Set(systems)].splice(0, 5);
			setSystems(systems);
		} else {
			// A Search System is to be implemented
		}
	}

	return (
		<div className="shipYard">
			<h1>Select Systems</h1>
			<div className="searchBox">
				<input type="text" placeholder="Search" ref={searchRef} defaultValue={store.selectedSystem} />
				<button>Search</button>
			</div>
			<div className="systems">
				{systems.map((system) => {
					return (
						<div className="system" key={system}>
							<h2>{system}</h2>
							<button onClick={() => updateStore({ selectedSystem: system })}>Select</button>
						</div>
					);
				})}
			</div>
			{store.selectedSystem && <ShowShipYards />}
		</div>
	);
}

function ShowShipYards() {
	const { store, updateStore } = useContext(DataProvider);
	const [shipYards, setShipYards] = useState([]);

	useEffect(() => {
		CallEndPoint({ endpoint: ENDPOINTS.WAYPOINTS, params: { system: store.selectedSystem }, pageAll: true }).then((res) => {
			let validWayPoints = res.data.filter((waypoint) => waypoint.traits.map((trait) => trait.symbol).includes("SHIPYARD"));
			setShipYards(validWayPoints);
		});
	}, [store.selectedSystem]);

	return (
		<div className="shipShops">
			{shipYards.map((shipYard) => {
				return (
					<div className="shipShop" key={shipYard.symbol}>
						<div className="details">
							<div className="detail">
								<h1>Ship yard Type</h1>
								<h2>{shipYard.type}</h2>
								<h1>Symbol</h1>
								<h2>{shipYard.symbol}</h2>
								<h1>Ship yard Location</h1>
								<h2>
									X: {shipYard.x}, Y: {shipYard.y}
								</h2>
							</div>
							<div className="detail"></div>
							<div className="detail">
								<h1>Ship yard Traits</h1>
								<ul>
									{shipYard.traits.map((trait) => (
										<li>{trait.symbol.replaceAll("_", " ").title()}</li>
									))}
								</ul>
							</div>
							<div className="detail"></div>
						</div>

						<button onClick={() => updateStore({ selectedShipYard: shipYard })}>Open Shop</button>
					</div>
				);
			})}
		</div>
	);
}

function getSystems() {
	return CallEndPoint({ endpoint: ENDPOINTS.SYSTEMS }).then((res) => {
		CallEndPoint({ endpoint: ENDPOINTS.SYSTEMS, limit: res.totalCount });
	});
}
