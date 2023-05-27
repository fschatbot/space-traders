import React, { useContext, useEffect, useRef, useState } from "react";
import { CallEndPoint, DataProvider, ENDPOINTS } from "./spaceAPI";
import { toast } from "react-toastify";
import { useCountDown } from "./utils";
import Modal from "react-modal";
import "./styles/ships.css";

// Icons
import { BiInfoCircle, BiRocket } from "react-icons/bi";
import { BsEjectFill } from "react-icons/bs";
import { BiCurrentLocation } from "react-icons/bi";
import { HiOutlineLocationMarker, HiChevronDown, HiOutlineRefresh } from "react-icons/hi";
import { CgClose, CgScrollV } from "react-icons/cg";
import { BsShop } from "react-icons/bs";
import { TbCoins } from "react-icons/tb";

export default function Ships() {
	const { store, updateStore } = useContext(DataProvider);
	// useEffect(refresh, []);

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

			<OpenShop />
			<Eject />
		</div>
	);
}

function ShowShip({ data }) {
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
		if (/^X1-\w{1,2}\d{1,2}-\d{5}\w$/g.test(NavigationRef.current.value) === false) {
			NavigationActionRef.current.classList.remove("pending");
			NavigationActionRef.current.classList.add("error");
			toast.error("Invalid route format");
			return;
		}

		// Navigate the ship to the new route
		CallEndPoint({ endpoint: ENDPOINTS.NAVIGATE, body: { waypointSymbol: NavigationRef.current.value }, params: { ship: data.symbol } })
			.then((response) => toast.success("The ship's new destination has been set"))
			.then(refreshShip)
			.catch((error) => toast.error(error.message))
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
					{data.cargo.inventory.length !== 0 && (
						<button className="eject" onClick={() => updateStore({ ejectShip: data.symbol })}>
							<BsEjectFill /> Eject
						</button>
					)}
				</div>
				<div className="navigation">
					{/* TODO: Have a look over here when the ship is travelling or has reached its location */}
					<span>
						<BiCurrentLocation />
						{data.nav.status !== "IN_TRANSIT"
							? `${data.nav.route.destination.symbol} (${data.nav.route.destination.x}, ${data.nav.route.destination.y}) [${data.nav.route.destination.type.replaceAll("_", " ").title()}]`
							: `The ship will arive at a location at ${new Date(data.nav.route.arrival).preset("DD/MM/YYYY hh:mm:ss")}`}
						{data.nav.status === "DOCKED" && (
							<button className="containerButton" onClick={() => updateStore({ marketShip: data.symbol })}>
								<BsShop />
							</button>
						)}
					</span>
					<span>
						<HiOutlineLocationMarker />
						{data.nav.status !== "IN_TRANSIT"
							? `No Current Destination`
							: `${data.nav.route.destination.symbol} (${data.nav.route.destination.x}, ${data.nav.route.destination.y}) [${data.nav.route.destination.type.replaceAll("_", " ").title()}]`}
					</span>
					<div className="navigateAction" ref={NavigationActionRef}>
						<input type="text" placeholder="XX-XX00-00000X" maxLength={14} ref={NavigationRef} onKeyUp={(e) => (e.key === "Enter" ? NavigateShip() : 0)} />
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

	function Mine(survey) {
		CallEndPoint({ endpoint: ENDPOINTS.EXTRACT, params: { ship: data.symbol }, body: survey ? { survey } : {} })
			.then((res) => {
				toast.success(`Mined ${res.data.extraction.yield.units} ${res.data.extraction.yield.symbol.replace("_", " ").title()}`);
				setChaseTime(Date.now() + res.data.cooldown.remainingSeconds * 1000 + 1000); // 1 extra second just to be sure
			})
			.then(refresh)
			.catch(MineErr);
	}
	function SurveyMine() {
		CallEndPoint({ endpoint: ENDPOINTS.SURVEY, params: { ship: data.symbol } })
			// .then((response) => response.data.surveys[0].signature)
			.then((response) => {
				let survey = response.data.surveys[0]; // Getting the signature of the survey (TODO: Check out which survey to choose)
				setChaseTime(Date.now() + response.data.cooldown.remainingSeconds * 1000 + 1000); // 1 extra second just to be sure
				onTimerEnd(() => Mine(survey));
			})
			.then(() => toast.success("Survey Complete"))
			.catch(MineErr);
	}

	function MineErr(err) {
		if (err.error) {
			if (err.error.code === 4000) {
				toast.error("The ship was on cooldown");
				setChaseTime(Date.now() + err.error.data.cooldown.remainingSeconds * 1000 + 1000);
			} else {
				toast.error(err.error.message);
			}
		} else {
			console.warn(err);
		}
	}

	const { timeLeft, setChaseTime, onTimerEnd } = useCountDown();

	const MineableLocation = data.nav.route.destination.type === "ASTEROID_FIELD";
	const CanMine = data.mounts.find((mount) => mount.symbol.includes("MOUNT_MINING_LASER")) !== undefined;
	const CanSurvery = data.mounts.find((mount) => mount.symbol.includes("MOUNT_SURVEYOR")) !== undefined;
	const CanRefine = data.modules.find((mount) => mount.symbol.includes("MODULE_MINERAL_PROCESSOR")) !== undefined; // Doubtful
	const FullCargo = data.cargo.units === data.cargo.capacity;
	const isNotInMineState = data.nav.status !== "IN_ORBIT" || FullCargo || timeLeft.total_seconds > 0;

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
			{CanRefine && <button>Refine</button>}
			{MineableLocation && CanMine && (
				<button onClick={() => Mine()} disabled={isNotInMineState}>
					Mine
				</button>
			)}
			{MineableLocation && CanMine && CanSurvery && (
				<button onClick={SurveyMine} disabled={isNotInMineState}>
					Survey & Mine
				</button>
			)}
			{timeLeft.total_seconds > 0 && <span>Cooldown: {timeLeft.total_seconds}s</span>}
		</div>
	);
}

function Eject() {
	// Getting simple data from the store
	const { store, updateStore } = useContext(DataProvider);
	const ship = store.ships.find((ship) => ship.symbol === store.ejectShip); // Current selected ship
	const [isOpen, setIsOpen] = useState(store.ejectShip);

	useEffect(() => setIsOpen(store.ejectShip), [store.ejectShip]);
	const closeModal = () => {
		setSelectedItem({});
		setAmount(0);
		updateStore({ ejectShip: null });
	};

	const [selectedItem, setSelectedItem] = useState({});
	const [amount, setAmount] = useState(0);

	if (!store.ejectShip) return null;

	return (
		<Modal isOpen={!!isOpen} overlayClassName="ModalOverlay" className="Modal MarketModal" onRequestClose={closeModal} ariaHideApp={false}>
			<h1 className="title">Eject Resources</h1>
			<button onClick={closeModal} className="close">
				<CgClose />
			</button>
			<div className="content">
				<div className="sellContainer">
					<DropDown items={ship.cargo.inventory} update={setSelectedItem} choice={selectedItem} format={(item) => item.symbol} />
					<NumberSelector min={1} max={selectedItem.units} update={setAmount} />
				</div>
				<button
					onClick={() => {
						CallEndPoint({ endpoint: ENDPOINTS.EJECT_CARGO, params: { ship: ship.symbol }, body: { symbol: selectedItem.symbol, units: amount } })
							.then((res) => {
								toast.success(`Ejected ${amount} ${selectedItem.name} into space!`, { icon: "👋" });
								const newShipData = store.ships.map((ship) => (ship.symbol === store.ejectShip ? { ...ship, cargo: res.data.cargo } : ship));
								console.log(newShipData, res.data);
								updateStore({ ships: newShipData });
							})
							.catch((err) => toast.error(err.error.message));
					}}>
					Eject {amount} &times; {selectedItem.name} into space!
				</button>
			</div>
		</Modal>
	);
}

function OpenShop() {
	// Getting simple data from the store
	const { store, updateStore } = useContext(DataProvider);
	const ship = store.ships.find((ship) => ship.symbol === store.marketShip); // Current selected ship

	// Getting the market data
	const [isOpen, setIsOpen] = useState(store.marketShip);
	const [market, setMarket] = useState(undefined);
	useEffect(() => {
		setIsOpen(store.marketShip);
		if (store.marketShip) {
			// A ship was found
			CallEndPoint({
				endpoint: ENDPOINTS.MARKET,
				params: {
					system: ship.nav.systemSymbol,
					waypoint: ship.nav.waypointSymbol,
				},
			})
				.then((res) => setMarket(res.data))
				.catch((err) => toast.error(err.error.message));
		}
	}, [store.marketShip]);

	const closeModal = () => {
		setSelectedItem({});
		updateStore({ marketShip: undefined });
	};

	const [mode, updateMode] = useState("SELL");
	const [selectedItem, setSelectedItem] = useState({});
	const [amount, setAmount] = useState(0);

	const setMode = (mode) => {
		updateMode(mode);
		setSelectedItem({});
		setAmount(0);
	};

	if (!store.marketShip || !market) return null;

	// List of items can be sold
	const Sellables = ship.cargo.inventory
		.filter((item) => market.tradeGoods.find((good) => good.symbol === item.symbol) !== undefined)
		.map((item) => ({ ...item, ...market.tradeGoods.find((good) => good.symbol === item.symbol) }))
		.map((good) => ({ ...good, price: good.sellPrice }));
	const Buyables = market.tradeGoods.map((good) => ({ ...good, price: good.purchasePrice, name: good.symbol.replaceAll("_", " ").title() })).filter((good) => good.price < store.credits);

	return (
		<Modal isOpen={!!isOpen} overlayClassName="ModalOverlay" className="Modal MarketModal" onRequestClose={closeModal} ariaHideApp={false}>
			<h1 className="title">Markert</h1>
			<button onClick={closeModal} className="close">
				<CgClose />
			</button>
			{store.marketShip ? (
				<div className="content">
					<div className="modes">
						<button className={mode === "BUY" ? "active" : undefined} onClick={() => setMode("BUY")}>
							Buy Mode
						</button>
						<button className={mode === "SELL" ? "active" : undefined} onClick={() => setMode("SELL")}>
							Sell Mode
						</button>
					</div>

					{mode === "SELL" && Sellables.length > 0 && (
						<>
							<div className="sellContainer">
								<DropDown items={Sellables} update={setSelectedItem} choice={selectedItem} />
								<NumberSelector min={1} max={selectedItem.units} update={setAmount} />
							</div>
							<button
								onClick={() => {
									CallEndPoint({ endpoint: ENDPOINTS.SELL, params: { ship: ship.symbol }, body: { symbol: selectedItem.symbol, units: amount } })
										.then((res) => {
											toast.success(`Sold ${amount} ${selectedItem.name} for ${selectedItem.sellPrice * amount} credit(s)`);
											const newShipData = store.ships.map((ship) => (ship.symbol === store.marketShip ? { ...ship, cargo: res.data.cargo } : ship));
											updateStore({ ships: newShipData, credits: res.data.agent.credits });
										})
										.catch((err) => toast.error(err.error.message));
								}}>
								Sell for {selectedItem.sellPrice * amount} credit(s) <TbCoins />
							</button>
						</>
					)}
					{mode === "SELL" && Sellables.length === 0 && <div className="MarketWarning">No Sellable Items</div>}
					{mode === "BUY" && ship.cargo.units < ship.cargo.capacity && (
						<>
							<div className="sellContainer">
								<DropDown items={Buyables} update={setSelectedItem} choice={selectedItem} />
								<NumberSelector min={1} max={Math.min(ship.cargo.capacity - ship.cargo.units, Math.floor(store.credits / (selectedItem.price ?? 1)))} update={setAmount} />
							</div>
							<button
								onClick={() => {
									CallEndPoint({ endpoint: ENDPOINTS.BUY, params: { ship: ship.symbol }, body: { symbol: selectedItem.symbol, units: amount } })
										.then((res) => {
											toast.success(`Purchased ${amount} ${selectedItem.name} for ${selectedItem.sellPrice * amount} credit(s)`);
											const newShipData = store.ships.map((ship) => (ship.symbol === store.marketShip ? { ...ship, cargo: res.data.cargo } : ship));
											updateStore({ ships: newShipData, credits: res.data.agent.credits });
										})
										.catch((err) => toast.error(err.error.message));
								}}>
								Buy for {selectedItem.sellPrice * amount} credit(s) <TbCoins />
							</button>
						</>
					)}
					{mode === "BUY" && ship.cargo.units >= ship.cargo.capacity && <div className="MarketWarning">You don't have enough space in your ship!</div>}
				</div>
			) : (
				`No Peeping...`
			)}
		</Modal>
	);
}

function DropDown({ items, update, choice }) {
	const [dropdownStatus, setDropdownStatus] = useState(false);
	useEffect(() => {
		if (!choice.symbol) update(items[0]);
	}, [items]);

	return (
		<div className="dropdownGroup">
			<button onClick={() => setDropdownStatus(!dropdownStatus)}>
				<span className="selected">
					<span className="name">{choice.name}</span> <span className="price">&#8212; {choice.price} credit(s)</span>
				</span>
				<CgScrollV className="icon" />
			</button>
			<div className={"dropdown" + (dropdownStatus ? "" : " closed")}>
				{items.map((item) => (
					<span
						onClick={() => {
							update(item);
							setDropdownStatus(false);
						}}
						key={item.symbol}>
						<span className="name">{item.name}</span> <span className="price">&#8212; {item.price} credit(s)</span>
					</span>
				))}
			</div>
		</div>
	);
}

function NumberSelector({ min, max, update }) {
	const valueRef = useRef();

	const getVal = () => valueRef.current.value;
	const updateValue = () => update(Number(getVal()));
	function reduce() {
		validate();
		if (Number(getVal()) > min) valueRef.current.value = Number(getVal()) - 1;
		updateValue();
	}
	function increase() {
		validate();
		if (Number(getVal()) < max) valueRef.current.value = Number(getVal()) + 1;
		updateValue();
	}
	function validate() {
		// Ensure that the value is valid
		let val = Number(valueRef.current.value.replace(/[^0-9]/g, "") || min); // Remove all non numeric characters
		if (val < min) val = min;
		if (val > max) val = max;
		valueRef.current.value = val;
	}

	useEffect(() => {
		validate();
		updateValue();
	}, [min, max]);

	return (
		<div className="numberSelector">
			<button onClick={reduce}>-</button>
			<input
				type="input"
				max={max}
				min={min}
				defaultValue={min}
				ref={valueRef}
				onChange={() => {
					validate();
					updateValue();
				}}
			/>
			<button onClick={increase}>+</button>
		</div>
	);
}
