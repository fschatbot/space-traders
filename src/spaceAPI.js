import { useNavigate } from "react-router-dom";

const ENDPOINTS = {
	BASE: "https://api.spacetraders.io/v2/",
	CREATE_AGENT: {
		type: "POST",
		body: ["symbol", "faction"],
		url: "register",
	},
	AGENT_DATA: "my/agent",
	AGENT_FACTION: "my/factions",
	FACTIONS: "factions",
	AGENT_CONTRACTS: "my/contracts",
	SYSTEMS: "systems",
	WAYPOINTS: "systems/:system/waypoints",
	ORBIT: {
		type: "POST",
		url: "my/systems/:ship/orbit",
	},
	DOCK: {
		type: "POST",
		url: "my/ships/:ship/dock",
	},
	SWITCH_MODE: {
		method: "PATCH",
		body: { flightMode: ["CRUISE", "BURN", "DRIFT", "STEALTH"] },
		url: "my/ships/:ship/nav",
	},
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
	CARGO: "my/ships/:ship",
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
};

const responses = [];
const errors = [];

function CallEndPoint({ endpoint, token, body, method, params, limit, page }) {
	// Building the URL
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
	const url = ENDPOINTS.BASE + endpointURL;

	const urlEndpoints = [];
	if (limit) urlEndpoints.push(`limit=${limit}`);
	if (page) urlEndpoints.push(`page=${page}`);
	if (urlEndpoints.length) url += "?" + urlEndpoints.join("&");

	// Building the options
	const options = {
		method: method || endpoint.type,
		headers: {
			"Content-Type": "application/json",
		},
	};
	if (token || endpoint.token || url.includes("/my/")) {
		if (!getToken()) throw Error("Missing token");
		options.headers["Authorization"] = `Bearer ${getToken()}`;
	}

	const payloadBody = {};
	if (endpoint.body) {
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

	console.log("Calling endpoint:", url, options);
	// Fetching the data
	return fetch(url, options).then((response) => {
		return response.json().then((data) => {
			if (!response.ok || data.error) {
				errors.push(data);
				throw data;
			} else {
				responses.push(data);
				return data;
			}
		});
	});
}

function getToken() {
	return localStorage.getItem("token");
}

window.exposeRequests = function () {
	const items = { responses: responses, errors: errors, getToken: getToken, CallEndPoint: CallEndPoint, ENDPOINTS: ENDPOINTS };
	for (const item in items) {
		Object.defineProperty(window, item, {
			get: () => items[item],
			enumerable: true,
		});
	}
};

window.exposeRequests();

export { CallEndPoint, ENDPOINTS, getToken, responses, errors };
