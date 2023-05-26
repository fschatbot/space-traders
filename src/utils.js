import { useEffect, useState } from "react";

const divmod = (x, y) => [Math.floor(x / y), x % y];

function useCountDown(time, callback) {
	const updateInterval = 500;
	const [data, setData] = useState({
		chaseTime: new Date(time || 0),
		onEnd: callback || (() => 0),
	});
	const onTimerEnd = (callback) => setData((prevData) => ({ ...prevData, onEnd: callback }));
	const setChaseTime = (time) => setData((prevData) => ({ ...prevData, chaseTime: time }));

	const [timeLeft, setTimeLeft] = useState(getLeftTime());

	function getLeftTime() {
		let left = new Date(data.chaseTime) - new Date();
		const template = {
			days: 0,
			hours: 0,
			minutes: 0,
			seconds: 0,
			total_seconds: 0,
		};
		if (left > 0) {
			[template.days, left] = divmod(left, 1000 * 60 * 60 * 24); // [days, left]
			[template.hours, left] = divmod(left, 1000 * 60 * 60); // [hours, left]
			[template.minutes, left] = divmod(left, 1000 * 60); // [minutes, left]
			[template.seconds, left] = divmod(left, 1000); // [seconds, left]
			template.total_seconds = template.days * 24 * 60 * 60 + template.hours * 60 * 60 + template.minutes * 60 + template.seconds;
		}
		return template;
	}

	useEffect(() => {
		let interval = setInterval(() => {
			const newTime = getLeftTime();
			if (newTime.total_seconds === 0 && timeLeft.total_seconds !== 0) data.onEnd();
			setTimeLeft(newTime);
		}, updateInterval);
		return () => clearInterval(interval);
	}, [data]);

	return { timeLeft, setChaseTime, onTimerEnd };
}

export { useCountDown };
