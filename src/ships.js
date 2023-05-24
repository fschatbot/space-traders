import { useContext, useEffect, useReducer, useRef, useState } from "react";
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
		CallEndPoint({ endpoint: ENDPOINTS.AGENT_SHIPS, remember: 5 * 60 * 1000 })
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
	console.log(data);
	const { store, updateStore } = useContext(DataProvider);
	const NavigationActionRef = useRef();
	const NavigationRef = useRef();

	function refreshShip() {
		CallEndPoint({ endpoint: ENDPOINTS.GET_SHIP, params: { ship: data.symbol } }).then((response) => {
			const newShipDatas = store.ships.map((ship) => (ship.symbol === data.symbol ? response.data : ship));
			toast.success("Ship data has been refreshed");
			updateStore({ ships: newShipDatas });
		});
	}

	function NavigateShip() {
		NavigationActionRef.current.classList.add("pending");
		NavigationActionRef.current.classList.remove("error");
		// Basic verfication for quick response and decreased API call
		if (NavigationRef.current.value.length !== 14 || /^[A-z0-9]{2}-[A-z0-9]{4}-\d{5}[A-z0-9]$/g.test(NavigationRef.current.value) === false) {
			NavigationActionRef.current.classList.remove("pending");
			NavigationActionRef.current.classList.add("error");
			toast.error("Invalid route format");
			return;
		}

		// Navigate the ship to the new route
		CallEndPoint({ endpoint: ENDPOINTS.NAVIGATE, body: { waypointSymbol: NavigationRef.current.value }, params: { ship: data.symbol } })
			.then((response) => toast.success("The ship's new destination has been set"))
			.then(refreshShip)
			.catch((error) => {
				toast.error(error.message);
				console.warn(error);
			})
			.finally(() => NavigationActionRef.current.classList.remove("pending"));
	}

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
						{data.nav.status !== "IN_TRANSIT"
							? `${data.nav.route.destination.symbol} (${data.nav.route.destination.x}, ${data.nav.route.destination.y}) [${data.nav.route.destination.type.replaceAll("_", " ").title()}]`
							: `The ship will arive at a location at ${new Date(data.nav.route.arrival).preset("DD/MM/YYYY HH:mm:ss")}`}
					</span>
					<span>
						<HiOutlineLocationMarker />
						{data.nav.status !== "IN_TRANSIT"
							? `No Current Destination`
							: `${data.nav.route.destination.symbol} (${data.nav.route.destination.x}, ${data.nav.route.destination.y}) [${data.nav.route.destination.type.replaceAll("_", " ").title()}]`}
					</span>
					<div className="navigateAction" ref={NavigationActionRef}>
						<input type="text" placeholder="XX-XXXX-00000X" maxLength={14} ref={NavigationRef} onKeyUp={(e) => (e.key === "Enter" ? NavigateShip() : 0)} />
						<button onClick={NavigateShip}>
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
		IN_TRANSIT: "In Transit",
	};

	const [dropdownStatus, setDropdownStatus] = useState(false);

	function ToggleOrbit() {
		if (data.nav.status === "IN_TRANSIT") return toast.error("The ship can't be docked while in transit.");
		const ExpectedStatus = statusActionMap[data.nav.status];
		CallEndPoint({ endpoint: ExpectedStatus.toUpperCase(), params: { ship: data.symbol } })
			.then((response) => toast.success(ExpectedStatus === "dock" ? "The ship is now docked." : "The ship is now in orbit."))
			.then(refresh);
	}

	const [mouseInside, setMouseInside] = useState(false);
	// Debouncing effect
	useEffect(() => {
		const timeout = setTimeout(() => setDropdownStatus(mouseInside), 300);
		return () => clearTimeout(timeout);
	}, [mouseInside]);

	const MODES = ["CRUISE", "BURN", "DRIFT", "STEALTH"];
	delete MODES[MODES.indexOf(data.nav.flightMode)];

	return (
		<div className="actionGroup">
			<button onClick={ToggleOrbit} disabled={data.nav.status === "IN_TRANSIT"}>
				{statusActionMap[data.nav.status].title()}
			</button>
			<button>Deliver</button>
			<div
				className="dropdownGroup"
				onMouseLeave={() => {
					setMouseInside(false);
				}}
				onMouseEnter={() => {
					setMouseInside(true);
					setDropdownStatus(true);
				}}>
				<button className="flex items-center">
					{data.nav.flightMode.title()} <HiChevronDown />
				</button>
				<div className={"dropdown" + (dropdownStatus ? "" : " closed")}>
					{MODES.map((mode) => (
						<span
							onClick={() => {
								CallEndPoint({ endpoint: ENDPOINTS.SWITCH_MODE, params: { ship: data.symbol }, body: { flightMode: mode }, debug: true })
									.then(() => toast.success(`Flight mode swtiched to ${mode.title()}`))
									.then(refresh);
							}}
							key={mode}>
							{mode.title()}
						</span>
					))}
				</div>
			</div>
			<button disabled>Refuel</button>
			<button>Refine</button>
			<button>Mine</button>
			<button>Survey & Mine</button>
		</div>
	);
}
