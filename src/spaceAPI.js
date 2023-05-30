import { createContext } from "react";

// These are all the known endpoints for the SpaceTraders API
// Normal Strings are basic get requests (can be opened in the browser itself)
// Except the endpoints with `my` as they require token
// Type - The type of request that needs to be made
// Url - The endpoint url (if anything needs to be replaced it will have :<name>)
// body - The things that are required in the body of the request (if any)
// If its a dict then the key is the name of the body and the value is the list of possible values
// "?" at the start means that body part is optional
// Token - If the endpoint requires a token
// Requires - The things that are required to make the request (if any)
const ENDPOINTS = {
	BASE: "https://api.spacetraders.io/v2/",
	CREATE_AGENT: {
		type: "POST",
		body: ["symbol", "faction"],
		url: "register",
	},
	AGENT_SHIPS: "my/ships",
	AGENT_DATA: "my/agent",
	AGENT_FACTION: "my/factions",
	FACTIONS: "factions",
	AGENT_CONTRACTS: "my/contracts",
	CONTRACT: "my/contracts/:contract",
	SYSTEMS: "systems",
	SYSTEM: "systems/:system",
	WAYPOINTS: "systems/:system/waypoints",
	WAYPOINT: "systems/:system/waypoints/:waypoint",
	JUMP_GATE: "systems/:system/waypoints/:waypoint/jump-gate",
	ORBIT: {
		type: "POST",
		url: "my/ships/:ship/orbit",
	},
	DOCK: {
		type: "POST",
		url: "my/ships/:ship/dock",
	},
	SWITCH_MODE: {
		type: "PATCH",
		body: { flightMode: ["CRUISE", "BURN", "DRIFT", "STEALTH"] },
		url: "my/ships/:ship/nav",
	},
	SHIP_MODE: "my/ships/:ship/nav",
	NAVIGATE: {
		type: "POST",
		body: ["waypointSymbol"],
		url: "my/ships/:ship/navigate",
	},
	WARP: {
		type: "POST",
		requires: ["1xWARP_DRIVE"],
		body: ["systemSymbol"],
		url: "my/ships/:ship/warp",
	},
	JUMP: {
		type: "POST",
		requires: ["1xJUMP_DRIVE", "1xANTI_MATTER"],
		body: ["systemSymbol"],
		url: "my/ships/:ship/jump",
	},
	EXTRACT: {
		type: "POST",
		body: ["?survey"],
		url: "my/ships/:ship/extract",
	},
	SURVEY: {
		type: "POST",
		requires: ["1xSURVEY_MOUNT"],
		url: "my/ships/:ship/survey",
	},
	MARKET: {
		token: true,
		url: "systems/:system/waypoints/:waypoint/market",
	},
	ACCEPT_CONTRACT: {
		type: "POST",
		url: "my/contracts/:contract/accept",
	},
	SHIPYARD: {
		token: true,
		url: "systems/:system/waypoints/:waypoint/shipyard",
	},
	PURCHASE_SHIP: {
		type: "POST",
		body: ["shipType", "waypointSymbol"],
		url: "my/ships",
	},
	BUY: {
		type: "POST",
		body: ["symbol", "units"],
		url: "my/ships/:ship/purchase",
	},
	TRANSFER_CARGO: {
		type: "POST",
		body: ["tradeSymbol", "units", "shipSymbol"],
		url: "my/ships/:ship/transfer",
	},
	NEGOTIATE_CONTRACT: {
		type: "POST",
		url: "my/ships/:ship/negotiate/contract",
	},
	GET_SHIP: "my/ships/:ship",
	CARGO: "my/ships/:ship/cargo",
	REFINE: { type: "POST", url: "my/ships/:ship/refine", body: ["produce"] },
	CHART: { type: "POST", url: "my/ships/:ship/chart" },
	EJECT_CARGO: { type: "POST", url: "my/ships/:ship/jettison", body: ["symbol", "units"] },
	SELL: {
		type: "POST",
		requires: ["DOCKED"],
		body: ["symbol", "units"],
		url: "my/ships/:ship/sell",
	},
	DILIVER_CONTRACT: {
		type: "POST",
		body: ["shipSymbol", "tradeSymbol", "units"],
		url: "my/contracts/:contract/deliver",
	},
	COMPLETE_CONTRACT: {
		type: "POST",
		url: "my/contracts/:contract/fulfill",
	},
	SCAN_SYSTEM: {
		type: "POST",
		url: "my/ships/:ship/scan/systems",
	},
	SCAN_WAYPOINT: {
		type: "POST",
		url: "my/ships/:ship/scan/waypoints",
	},
	SCAN_SHIP: {
		type: "POST",
		url: "my/ships/:ship/scan/ships",
	},
	REFUEL: {
		type: "POST",
		url: "my/ships/:ship/refuel",
	},
};

const responses = [];
const errors = [];

class API_ERROR extends Error {
	constructor({ endpoint, error }) {
		super(error.error);

		console.warn(error.error.message, error);

		this.endpoint = endpoint;
		this.error = error.error;
		this.message = error.error.message;
	}
}

function trueTimeout(func, ms, ...args) {
	let chase = new Date().getTime() + ms;
	let id = setInterval(() => {
		let delta = chase - new Date().getTime();
		if (delta <= 0) {
			clearInterval(id);
			func(...args);
		}
	}, ms / 10); // Just to be 10 times more sure
}

// This rate-limitting code was made by Leaf#1950 (493775082389241859)
export class Bucket {
	constructor(count, interval) {
		this.count = count;
		this.interval = interval;
		this.current = { count: 0, start: 0 };
	}

	get expired() {
		return this.current.start + this.interval < Date.now();
	}

	get remaining() {
		return this.expired ? this.count : Math.max(this.count - this.current.count, 0);
	}

	get full() {
		return !this.remaining;
	}

	add() {
		if (this.full) throw Object.assign(new Error("Bucket is full"), { bucket: this });
		if (this.expired) {
			this.current = { count: 1, start: Date.now() };
		} else {
			this.current.count++;
		}
	}
}

export class Ratelimiter {
	#queue;
	#buckets;

	constructor(buckets) {
		this.#queue = [];
		this.#buckets = buckets.map((bucket) => new Bucket(bucket.count, bucket.interval));
	}

	async #emptyQueue() {
		while (this.#queue.length) {
			if (this.#buckets.every((bucket) => bucket.full)) {
				// If all are full, then wait for one to expire
				const timeout = Math.min(...this.#buckets.map((bucket) => bucket.current.start + bucket.interval)) - Date.now();
				await new Promise((resolve) => trueTimeout(resolve, timeout));
			} else {
				// If one is empty then add to it
				// Putting it inside else eliminates the problems faced by timeouts not being perfect
				this.#buckets.find((bucket) => !bucket.full).add();
				this.#queue.shift()();
			}
		}
	}

	queue() {
		const promise = new Promise((resolve) => {
			this.#queue.push(resolve);
		});
		if (this.#queue.length === 1) this.#emptyQueue();
		return promise;
	}
}

const ratelimiter = new Ratelimiter([
	{ count: 2, interval: 1_000 },
	{ count: 10, interval: 10_000 },
]);

async function ratelimitedFetch(...args) {
	await ratelimiter.queue();
	return fetch(...args);
}

// This function is responsible for calling the API
// token: boolean - If the endpoint requires a token
// body: object - The body of the request
// method: string - The method of the request
// params: object - This will contain the :param replacements for the url
// limit: number - Add a url payload for the item limit (pagination)
// page: number - Add a url payload for the page number (pagination)
// pageAll: boolean - If the endpoint should be paginated until all items are fetched (pagination)
// debug: boolean - Log certain data points to the console
// remember: boolean - If the response should be saved in the indexDB
function CallEndPoint({ endpoint, token, body = {}, method, params, limit, page, pageAll, remember, debug = false }) {
	// Building the URL
	// endpoint: ENDPOINT key string, ENDPOINT URL, ENDPOINT object
	if (endpoint in ENDPOINTS) endpoint = ENDPOINTS[endpoint];
	let endpointURL = typeof endpoint === "string" ? endpoint : endpoint.url;
	if (params) {
		for (const param in params) {
			endpointURL = endpointURL.replace(`:${param}`, params[param]);
		}
		// Checking if anything is missing
		const missing = endpointURL.match(/:[a-zA-Z]+/g);
		if (missing) {
			throw new Error(`Missing parameters: ${missing.join(", ")}`);
		}
	}
	let url = ENDPOINTS.BASE + endpointURL;

	const urlEndpoints = [];
	if (limit) urlEndpoints.push(`limit=${limit}`);
	if (page) urlEndpoints.push(`page=${page}`);
	if (urlEndpoints.length) url += "?" + urlEndpoints.join("&");

	// Building the options
	const options = {
		method: method || endpoint.type || "GET",
		headers: {
			"Content-Type": "application/json",
		},
	};
	if (token || endpoint.token || url.includes("/my/")) {
		if (!getToken()) throw Error("Missing token");
		options.headers["Authorization"] = `Bearer ${getToken()}`;
	}

	const payloadBody = {};
	if (endpoint.body && endpoint.body instanceof Array) {
		// Adding the parameters which are required first
		endpoint.body.forEach((param) => {
			if (param.includes("?")) {
				// Optional parameter
				param = param.replace("?", "");
				if (param in body) {
					payloadBody[param] = body[param];
					delete body[param];
				}
			} else {
				if (!(param in body)) throw new Error(`Missing payload body parameter: ${param}`);
				payloadBody[param] = body[param];
				delete body[param];
			}
		});
	} else if (endpoint.body && typeof endpoint.body === "object") {
		// Adding the parameters which are required first
		for (let param in endpoint.body) {
			if (param.includes("?")) {
				// Optional parameter
				param = param.replace("?", "");
				if (param in body) {
					if (endpoint.body[param].indexOf(body[param]) < 0) throw new Error(`Invalid param value for ${param}`);
					payloadBody[param] = body[param];
					delete body[param];
				}
			} else {
				if (!(param in body)) throw new Error(`Missing payload body parameter: ${param}`);
				if (endpoint.body[param].indexOf(body[param]) < 0) throw new Error(`Invalid param value for ${param}`);
				payloadBody[param] = body[param];
				delete body[param];
			}
		}
	}
	// Adding the rest of the parameters
	for (const param in body) {
		payloadBody[param] = body[param];
	}

	if (Object.keys(payloadBody).length > 0) {
		options.body = JSON.stringify(payloadBody);
	}

	// Checking requirements (Optional)
	if (endpoint.requires) {
		// TODO: Check if the user has the required items
	}

	debug && console.log("Calling endpoint:", url, options);
	// Fetching the data
	return ratelimitedFetch(url, options).then((response) => {
		return response.json().then((data) => {
			if (!response.ok || data.error) {
				errors.push(data);
				if (debug) console.warn("Error:", data);
				else throw new API_ERROR({ endpoint: url, error: data });
			} else {
				responses.push(data);
				debug && console.info("Response:", data);
				return data;
			}
		});
	});
}

function getToken() {
	return localStorage.getItem("token");
}

window.exposeRequests = function () {
	const items = { responses, errors, getToken, CallEndPoint, ENDPOINTS, getSystems };
	for (const item in items) {
		Object.defineProperty(window, item, {
			get: () => items[item],
			enumerable: true,
		});
	}
};
window.exposeRequests();

function getSystems() {
	return fetch("systems.json").then((response) => response.json());
}

export const DataProvider = createContext({});

export { CallEndPoint, ENDPOINTS, getToken, responses, errors };

// TODO:
// - Cache responses
// - Check if the ship has the required items
// - Full Pagination (pageAll)
// - Adding remember tag to endpoints
