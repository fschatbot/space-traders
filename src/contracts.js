import { useContext, useEffect } from "react";
import { CallEndPoint, DataProvider, ENDPOINTS } from "./spaceAPI";
import "./styles/contracts.css";

export default function Contracts() {
	const { store, updateStore } = useContext(DataProvider);
	window.store = store;
	useEffect(() => {
		refreshContracts();
	}, []);

	function refreshContracts() {
		CallEndPoint({ endpoint: ENDPOINTS.AGENT_CONTRACTS }).then((response) => {
			if (response.meta.total <= response.meta.limit) return updateStore({ contracts: response.data });
			// Otherwise call it second time but with everything
			CallEndPoint({ endpoint: ENDPOINTS.AGENT_CONTRACTS, limit: response.meta.total }).then((response) => {
				updateStore({ contracts: response.data });
			});
		});
	}

	if (!store.contracts) return <div className="contracts">Loading...</div>;
	return (
		<div className="contracts">
			{store.contracts.map((contract) => {
				return (
					<div className="contract" key={contract.id}>
						<div className="details">
							<div className="detail">
								<h1>Items To Deliver:</h1>
								<ul>
									{contract.terms.deliver.map((item) => {
										return (
											<li key={item.tradeSymbol}>
												{item.unitsRequired - item.unitsFulfilled} {item.tradeSymbol.replace("_", " ").title()} to {item.destinationSymbol}
											</li>
										);
									})}
								</ul>
							</div>
							<div className="detail">
								<h1>Deadline:</h1>
								<h2>{new Date(contract.terms.deadline).preset("hh:mm:ss DD/MM/YYYY")}</h2>
							</div>
						</div>
						{!contract.accepted && <button onClick={() => CallEndPoint({ endpoint: ENDPOINTS.ACCEPT_CONTRACT, params: { contract: contract.id } })}>Accept</button>}
						{contract.accepted && <button disabled>Accepted</button>}
					</div>
				);
			})}
		</div>
	);
}
