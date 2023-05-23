import { useContext, useEffect } from "react";
import { CallEndPoint, DataProvider, ENDPOINTS } from "./spaceAPI";
import { BiInfoCircle, BiRocket } from "react-icons/bi";
import { BsEjectFill } from "react-icons/bs";
import { BiCurrentLocation } from "react-icons/bi";
import { HiOutlineLocationMarker, HiChevronDown, HiOutlineRefresh } from "react-icons/hi";
import "./styles/ships.css";
import { toast } from "react-toastify";

export default function Ships() {
	const { store, updateStore } = useContext(DataProvider);
	useEffect(refresh, []);

	function refresh() {
		CallEndPoint({ endpoint: ENDPOINTS.AGENT_SHIPS })
			.then((response) => updateStore({ ships: response.data }))
			.then(() => toast.success("Ships data has been refreshed"));
	}

	return (
		<div className="shipsContainer">
			<h1>
				<HiOutlineRefresh className="cursor-pointer" title="refresh data" onClick={refresh} />
				Your Ships
			</h1>
			{store.ships.map((shipdata) => (
				<ShowShip data={shipdata} key={shipdata.symbol} />
			))}
		</div>
	);
}

function ShowShip({ data }) {
	const { store, updateStore } = useContext(DataProvider);

	function refreshShip() {
		CallEndPoint({ endpoint: ENDPOINTS.GET_SHIP, params: { ship: data.symbol } }).then((response) => {
			const newShipDatas = store.ships.map((ship) => (ship.symbol === data.symbol ? response.data : ship));
			toast.success("Ship data has been refreshed");
			updateStore({ ships: newShipDatas });
		});
	}
	console.log(data);
	return (
		<div className="shipContainer">
			<h1 className="title">
				<BiInfoCircle className="cursor-pointer" /> {data.symbol}
			</h1>
			<div className="shipInfo">
				<div className="fuelContainer">
					<h2>
						Fuel: {data.fuel.current}/{data.fuel.capacity}
					</h2>
					<div className="fuelBar">
						<div className="fuel" style={{ width: `${(data.fuel.current / data.fuel.capacity) * 100}%` }} />
					</div>
				</div>
				<div className="cargo">
					<h2>
						Cargo: <strong>{data.cargo.units}</strong> units out of <strong>{data.cargo.capacity}</strong> units
					</h2>
					<ul>
						{data.cargo.inventory.map((item) => (
							<li key={item.symbol} title={item.description}>
								{item.name} &times; {item.units}
							</li>
						))}
						{data.cargo.inventory.length === 0 && <li className="empty">Empty</li>}
					</ul>
					<button className="eject">
						<BsEjectFill /> Eject
					</button>
				</div>
				<div className="navigation">
					{/* TODO: Have a look over here when the ship is travelling or has reached its location */}
					<span>
						<BiCurrentLocation />
						{data.nav.route.departure.symbol} ({data.nav.route.departure.x}, {data.nav.route.departure.y}) [{data.nav.route.departure.type.replaceAll("_", " ").title()}]
					</span>
					<span>
						<HiOutlineLocationMarker />
						{data.nav.route.destination.symbol} ({data.nav.route.destination.x}, {data.nav.route.destination.y}) [{data.nav.route.destination.type.replaceAll("_", " ").title()}]
					</span>
					<div className="navigateAction">
						<input type="text" placeholder="XX-XXXX-00000X" />
						<button>
							<BiRocket />
						</button>
					</div>
				</div>
			</div>
			<ActionButtons data={data} refresh={refreshShip} />
			<button className="refresh" title="refresh data" onClick={refreshShip}>
				<HiOutlineRefresh />
			</button>
		</div>
	);
}

function ActionButtons({ data, refresh }) {
	const statusActionMap = {
		DOCKED: "orbit",
		IN_ORBIT: "dock",
	};
	function ToggleOrbit() {
		const ExpectedStatus = statusActionMap[data.nav.status];
		CallEndPoint({ endpoint: ExpectedStatus.toUpperCase(), params: { ship: data.symbol } })
			.then((response) => toast.success(ExpectedStatus === "dock" ? "The ship is now docked." : "The ship is now in orbit."))
			.then(refresh);
	}
	return (
		<div className="actionGroup">
			<button onClick={ToggleOrbit}>{statusActionMap[data.nav.status].title()}</button>
			<button>Deliver</button>
			<div className="dropdownGroup">
				<button className="flex items-center">
					Cruise <HiChevronDown />
				</button>
				<div className="dropdown hidden">
					<span>Burn</span>
					<span>Drift</span>
					<span>Stealth</span>
				</div>
			</div>
			<button disabled>Refuel</button>
			<button>Refine</button>
			<button>Mine</button>
			<button>Survey & Mine</button>
		</div>
	);
}
