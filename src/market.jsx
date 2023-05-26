import { CallEndPoint, ENDPOINTS, DataProvider } from "./spaceAPI";
import { useContext, useEffect, useReducer, useRef, useState } from "react";
import { toast } from "react-toastify";
import { BiSearchAlt } from "react-icons/bi";
import { TbUfo } from "react-icons/tb";
import "./styles/market.css";

export default function MarketPlace() {
	const searchContainerRef = useRef();
	const searchBoxRef = useRef();

	const { store, updateStore } = useContext(DataProvider);

	function search() {
		searchContainerRef.current.classList.add("pending");
		searchContainerRef.current.classList.remove("error");
		// Basic verfication for quick response and decreased API call
		if (/^X1-\w{1,2}\d{1,2}$/g.test(searchBoxRef.current.value) === false) {
			searchContainerRef.current.classList.remove("pending");
			searchContainerRef.current.classList.add("error");
			toast.error("Invalid System code!");
			return;
		}

		// Navigate the ship to the new route
		CallEndPoint({ endpoint: ENDPOINTS.WAYPOINTS, params: { system: searchBoxRef.current.value }, pageAll: true })
			.then((res) => updateStore({ marketWaypoints: res.data }))
			.then(() => toast.success(`Waypoints from the system ${searchBoxRef.current.value} has been successfully fetched`))
			.catch((error) => {
				toast.error(error.message);
				console.warn(error);
			})
			.finally(() => searchContainerRef.current.classList.remove("pending"));
	}

	const MarketPlaces = store.marketWaypoints.filter((waypoint) => waypoint.traits.find((trait) => trait.symbol === "MARKETPLACE"));

	return (
		<div className="marketContainer">
			<h1 className="title">Search for Marketplaces</h1>
			<div className="searchBox" ref={searchContainerRef}>
				<input type="text" placeholder="System Code..." maxLength={7} ref={searchBoxRef} onKeyUp={(e) => (e.key === "Enter" ? search() : 0)} />
				<button onClick={search}>
					<BiSearchAlt />
				</button>
			</div>
			{MarketPlaces.length === 0 && store.marketWaypoints.length !== 0 && (
				<h2 className="noMarket">
					<TbUfo /> No Marketplaces were found
				</h2>
			)}
			{MarketPlaces.length > 0 && (
				<div className="markets">
					{MarketPlaces.map((waypoint) => (
						<ShowMarket data={waypoint} key={waypoint.symbol} />
					))}
				</div>
			)}
		</div>
	);
}

function ShowMarket({ data }) {
	const { store, updateStore } = useContext(DataProvider);

	function updateMarket() {
		CallEndPoint({ endpoint: ENDPOINTS.MARKET, params: { waypoint: data.symbol, system: data.systemSymbol } })
			.then((response) => {
				const newMarketData = store.marketWaypoints.map((waypoint) => (waypoint.symbol === data.symbol ? { ...waypoint, market: response.data } : waypoint));
				updateStore({ marketWaypoints: newMarketData });
			})
			.then(() => toast.success("Successfully Fetched the market data"));
	}
	console.log(data);
	const canExchange = data.market?.tradeGoods !== undefined;
	const shipsOnWaypoint = store.ships.filter((ship) => ship.nav.waypointSymbol === data.symbol);
	console.log(
		store.ships,
		shipsOnWaypoint,
		canExchange,
		shipsOnWaypoint.find((ship) => ship.nav.status === "DOCKED")
	);
	return (
		<div className="market">
			<h1>{data.symbol}</h1>
			<h2>
				{data.type.replace("_", " ").title()} at ({data.x}, {data.y})
			</h2>
			{data.market && (
				<div className="sales">
					<h1 title="Higher sale prices">Imports</h1>
					<div className="list">
						{data.market.imports.map((item) => (
							<span title={item.description} key={item.symbol}>
								{item.name}
							</span>
						))}
					</div>
					<h1 title="Lower Purchase prices">Exports</h1>
					<div className="list">
						{data.market.exports.map((item) => (
							<span title={item.description} key={item.symbol}>
								{item.name}
							</span>
						))}
					</div>
					<h1 title="Flutuating prices">Exchanges</h1>
					<div className="list">
						{data.market.exports.map((item) => (
							<span title={item.description} key={item.symbol}>
								{item.name}
							</span>
						))}
					</div>
					{canExchange && <button disabled={shipsOnWaypoint.find((ship) => ship.nav.status === "DOCKED") === undefined}>Exchange</button>}
				</div>
			)}
			{!data.market && <button onClick={updateMarket}>Fetch data</button>}
		</div>
	);
}
