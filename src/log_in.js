import { useEffect, useRef, useState } from "react";
import { ENDPOINTS, CallEndPoint, getToken } from "./spaceAPI";
import { useNavigate } from "react-router-dom";
import "./styles/login.css";

export default function LogInModal() {
	// Check if the person is logged in
	const navigate = useNavigate();

	useEffect(() => {
		if (!navigate) return;
		if (getToken()) navigate("/ships");
	}, [navigate]);

	const [usernameError, setNameError] = useState();
	const nameRef = useRef();
	const [TokenError, setTokenError] = useState();
	const tokenRef = useRef();

	function register() {
		if (!nameRef.current.value) return setNameError("Name is required");
		CallEndPoint({ endpoint: ENDPOINTS.CREATE_AGENT, body: { symbol: nameRef.current.value, faction: "COSMIC" } })
			.then((response) => {
				localStorage.setItem("token", response.token);
				console.log(response);
			})
			.catch((response) => setNameError(Object.values(response.error.data)[0][0])); // Set the first error message
	}

	function logIn() {
		if (!tokenRef.current.value) return setTokenError("Token is required");
		localStorage.setItem("token", tokenRef.current.value);
		CallEndPoint({ endpoint: ENDPOINTS.AGENT_DATA })
			.then((response) => {
				console.log(response);
				navigate("/ships");
			})
			.catch((response) => setTokenError(response.error.message)); // Set the first error message
	}

	return (
		<div className="logInContainer">
			<div className="modal">
				<h1 className="title">
					Welcome <span className="text-yellow-600">Space Trader</span>
				</h1>
				<input type="text" placeholder="Enter Name" id="username" ref={nameRef} />
				<label htmlFor="username" className="error">
					{usernameError}
				</label>
				<button onClick={register}>Create Account from Name</button>

				<h1 className="seperator">
					<span>or</span>
				</h1>

				<input type="text" placeholder="Enter Token" id="token" ref={tokenRef} />
				<label htmlFor="token" className="error">
					{TokenError}
				</label>
				<button onClick={logIn}>Log in using token</button>
			</div>
		</div>
	);
}
