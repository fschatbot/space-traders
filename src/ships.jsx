import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
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
import { BsShop, BsFillFuelPumpFill, BsPatchCheck } from "react-icons/bs";
import { TbCoins, TbRotateClockwise2, TbRadar } from "react-icons/tb";
import { FaRegLaughBeam } from "react-icons/fa";
import { LuFuel, LuUsers, LuAngry, LuAnnoyed, LuFrown, LuMeh, LuSmile, LuZap, LuGauge, LuTimerReset, LuPackage, LuBoxSelect, LuExpand } from "react-icons/lu";

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

			<ShipInfo />
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
		if (NavigationActionRef.current.classList.contains("pending")) return toast.warn("Please wait!");
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
			.then(() => toast.success("The ship's new destination has been set"))
			.then(() => refreshShip())
			.catch((error) => {
				NavigationActionRef.current.classList.add("error");
				toast.error(error.message);
			})
			.finally(() => NavigationActionRef.current.classList.remove("pending"));
	}

	const refreshShipCallBack = useCallback(refreshShip, []);

	const MoralIcons = [<LuAngry />, <LuAnnoyed />, <LuFrown />, <LuMeh />, <LuSmile />, <FaRegLaughBeam />];

	return (
		<div className="shipContainer">
			<h1 className="title">
				<BiInfoCircle className="cursor-pointer" onClick={() => updateStore({ shipInfo: data.symbol })} /> {data.symbol}
			</h1>
			<div className="shipInfo">
				<div className="basiInfo">
					<div className="fuelContainer">
						<h2>
							<LuFuel /> Fuel: {data.fuel.current}/{data.fuel.capacity}
						</h2>
						<div className="progress">
							<div className="bar" style={{ width: `${(data.fuel.current / data.fuel.capacity) * 100}%` }} />
						</div>
					</div>
					<div className="crewContainer">
						<h2 title={`Atleast ${data.crew.required} people are required`}>
							<LuUsers /> Crew: {data.crew.current}/{data.crew.capacity}
						</h2>
						<div className="progress">
							<div className="bar" style={{ width: `${(data.crew.current / data.crew.capacity) * 100}%` }} />
							{data.crew.required && <div className="threshold" style={{ left: `${(data.crew.required / data.crew.capacity) * 100}%` }} />}
						</div>
					</div>
					<div className="quickInfo">
						<span title="Power">
							<LuZap /> {data.reactor.powerOutput}
						</span>
						<span title="Morale">
							{MoralIcons[Math.round(((MoralIcons.length - 1) * data.crew.morale) / 100)]} {data.crew.morale}
						</span>
						<span title="Speed">
							<LuGauge /> {data.engine.speed}
						</span>
					</div>
				</div>
				<div className="cargo">
					<h2 className="textAlign">
						<LuPackage /> Cargo: <strong>{data.cargo.units}</strong> units out of <strong>{data.cargo.capacity}</strong> units
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
			<ActionButtons data={data} refresh={refreshShipCallBack} />
			<button className="refresh" title="refresh data" onClick={refreshShip}>
				<HiOutlineRefresh />
			</button>
		</div>
	);
}

function ActionButtons({ data, refresh }) {
	const { store, updateStore } = useContext(DataProvider);
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
		return CallEndPoint({ endpoint: ENDPOINTS.EXTRACT, params: { ship: data.symbol }, body: survey ? { survey } : {} })
			.then((res) => {
				toast.success(`Mined ${res.data.extraction.yield.units} ${res.data.extraction.yield.symbol.replace("_", " ").title()}`);
				setChaseTime(Date.now() + res.data.cooldown.remainingSeconds * 1e3 + 1000); // 1 extra second just to be sure
				// Updating the cargo
				const newShipData = store.ships.map((ship) => (ship.symbol === data.symbol ? { ...ship, cargo: res.data.cargo } : ship));
				updateStore({ ships: newShipData });
			})
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

	// Auto-Mining
	const [autoMine, setAutoMine] = useState(false);
	useEffect(() => {
		if (data.cargo.units < data.cargo.capacity && autoMine && timeLeft.total_seconds === 0 && data.nav.status === "IN_ORBIT") {
			Mine();
		}
	}, [autoMine, timeLeft.total_seconds, data.nav.status]);

	// JS for the deliver button
	const contracts = store.contracts.filter(
		(contract) =>
			contract.accepted &&
			!contract.fullfilled &&
			contract.terms.deliver.find((deliver) => deliver.destinationSymbol === data.nav.waypointSymbol && deliver.unitsFulfilled < deliver.unitsRequired) !== undefined
	);
	// console.log(contracts);

	return (
		<div className="actionGroup">
			<button onClick={ToggleOrbit} disabled={data.nav.status === "IN_TRANSIT"}>
				{statusActionMap[data.nav.status].title()}
			</button>
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
			{contracts.length > 0 && <button>Deliver</button>}
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
			{MineableLocation && CanMine && <button onClick={() => setAutoMine(!autoMine)}>{!autoMine ? "Enable" : "Disable"} AutoMine</button>}
			{timeLeft.total_seconds > 0 && (
				<span>
					<LuTimerReset /> Cooldown: {timeLeft.total_seconds}s
				</span>
			)}
		</div>
	);
}

function ShipInfo() {
	const { store, updateStore } = useContext(DataProvider);
	const ship = store.ships.find((ship) => ship.symbol === store.shipInfo); // Current selected ship

	// Opening and closing mechanism
	const [isOpen, setIsOpen] = useState(store.shipInfo);
	useEffect(() => setIsOpen(store.shipInfo), [store.shipInfo]);
	const closeModal = () => updateStore({ shipInfo: null });
	if (!store.shipInfo) return null;

	// All the actual variables start from here
	const MoralIcons = [<LuAngry />, <LuAnnoyed />, <LuFrown />, <LuMeh />, <LuSmile />, <FaRegLaughBeam />];

	console.log(ship);

	function Component({ name }) {
		return (
			<div className={name}>
				<h2>{name.title()}</h2>
				<h3 className="flex-grow">
					{ship[name].name}: {ship[name].description}
				</h3>
				<div className="basic">
					<span title="condition">
						<BsPatchCheck /> {ship[name].condition}%
					</span>
					{ship[name].requirements.power && (
						<span title="required power">
							<LuZap /> {ship[name].requirements.power}
						</span>
					)}
					{ship[name].requirements.crew && (
						<span title="required crew">
							<LuUsers /> {ship[name].requirements.crew}
						</span>
					)}
					{ship[name].requirements.slots && (
						<span title="required slots">
							<LuBoxSelect /> {ship[name].requirements.slots}
						</span>
					)}
				</div>
			</div>
		);
	}
	function AttachmentBasic({ attachment }) {
		return (
			<div className="basic">
				{attachment.capacity !== undefined && (
					<span title="Increased Capacity">
						<LuExpand /> +{attachment.capacity}
					</span>
				)}
				{attachment.range !== undefined && (
					<span title="Increased range">
						<TbRadar /> +{attachment.range}
					</span>
				)}
				{attachment.strength !== undefined && (
					<span title="Increased strength">
						<LuZap /> +{attachment.strength}
					</span>
				)}
				{attachment.requirements.power !== undefined && (
					<span title="required power">
						<LuZap /> {attachment.requirements.power}
					</span>
				)}
				{attachment.requirements.crew !== undefined && (
					<span title="required crew">
						<LuUsers /> {attachment.requirements.crew}
					</span>
				)}
				{attachment.requirements.slots !== undefined && (
					<span title="required slots">
						<LuBoxSelect /> {attachment.requirements.slots}
					</span>
				)}
			</div>
		);
	}

	return (
		<Modal isOpen={!!isOpen} overlayClassName="ModalOverlay" className="Modal InfoModal" onRequestClose={closeModal} ariaHideApp={false}>
			<h1 className="title">{ship.registration.name}</h1>
			<button onClick={closeModal} className="close">
				<CgClose />
			</button>
			<div className="content">
				<div className="initial">
					Faction: {ship.registration.factionSymbol.title()} <br />
					Role: {ship.registration.role.title()} <br />
				</div>
				<div className="basic">
					<span title="Fuel">
						<LuFuel /> {ship.fuel.current}/{ship.fuel.capacity}
					</span>
					<span title="Power">
						<LuZap /> {ship.reactor.powerOutput}
					</span>
					<span title="Speed">
						<LuGauge /> {ship.engine.speed}
					</span>
					<span title="Cargo">
						<LuPackage /> {ship.cargo.units}/{ship.cargo.capacity}
					</span>
					<span title="Crew">
						<LuUsers /> {ship.crew.current}/{ship.crew.capacity}
					</span>
					<span title="Morale">
						{MoralIcons[Math.round(((MoralIcons.length - 1) * ship.crew.morale) / 100)]} {ship.crew.morale}
					</span>
					<span title="Wages">
						<TbCoins /> {ship.crew.wages}
					</span>
					<span title={`${ship.crew.rotation === "STRICT" ? "↑" : "↓"} performace, ${ship.crew.rotation === "RELAXED" ? "↑" : "↓"} morale`}>
						<TbRotateClockwise2 /> {ship.crew.rotation.title()} Rotation
					</span>
				</div>
				<div className="componenets">
					<Component name="frame" />
					<Component name="engine" />
					<Component name="reactor" />
				</div>
				<div className="attachments">
					<div className="modules">
						<h2>
							Modules ({ship.modules.reduce((count, module) => count + module.requirements.slots, 0)}/{ship.frame.moduleSlots})
						</h2>
						{ship.modules.map((module) => (
							<div className="module">
								<h3>
									{module.name}: {module.description}
								</h3>
								<AttachmentBasic attachment={module} />
							</div>
						))}
					</div>
					<div className="mounts">
						<h2>
							Mounts ({ship.mounts.length}/{ship.frame.mountingPoints})
						</h2>
						{ship.mounts.map((mount) => (
							<div className="mount">
								<h3>
									{mount.name}: {mount.description}
								</h3>
								<AttachmentBasic attachment={mount} />
							</div>
						))}
					</div>
				</div>
			</div>
		</Modal>
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
							.catch((err) => toast.error(err.message));
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
				.catch((err) => toast.error(err.message));
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
										.catch((err) => toast.error(err.message));
								}}>
								Sell for {selectedItem.sellPrice * amount} credit(s) <TbCoins />
							</button>
							<button
								onClick={() => {
									CallEndPoint({ endpoint: ENDPOINTS.SELL, params: { ship: ship.symbol }, body: { symbol: selectedItem.symbol, units: selectedItem.units } })
										.then((res) => {
											toast.success(`Sold ${selectedItem.units} ${selectedItem.name} for ${selectedItem.sellPrice * selectedItem.units} credit(s)`);
											const newShipData = store.ships.map((ship) => (ship.symbol === store.marketShip ? { ...ship, cargo: res.data.cargo } : ship));
											updateStore({ ships: newShipData, credits: res.data.agent.credits });
										})
										.catch((err) => toast.error(err.message));
								}}>
								Sell All!
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
										.catch((err) => toast.error(err.message));
								}}>
								Buy for {selectedItem.sellPrice * amount} credit(s) <TbCoins />
							</button>
						</>
					)}
					{mode === "BUY" && ship.cargo.units >= ship.cargo.capacity && <div className="MarketWarning">You don't have enough space in your ship!</div>}
					{mode === "BUY" && Buyables.find((good) => good.symbol === "FUEL") !== undefined && ship.fuel.current < ship.fuel.capacity && (
						<button
							onClick={() => {
								CallEndPoint({ endpoint: ENDPOINTS.REFUEL, params: { ship: ship.symbol } }).then((res) => {
									toast.success(`Refueled for ${res.data.transaction.totalPrice} credit(s)`);
									const newShipData = store.ships.map((ship) => (ship.symbol === store.marketShip ? { ...ship, fuel: res.data.fuel } : ship));
									updateStore({ ships: newShipData, credits: res.data.agent.credits });
								});
							}}>
							Refuel <BsFillFuelPumpFill />
						</button>
					)}
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
		if (!choice.symbol || items.find((item) => item.symbol === choice.symbol) === undefined) update(items[0]);
	}, [items, choice]);

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
