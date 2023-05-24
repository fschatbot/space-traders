import requests, json
from time import sleep
from rich.progress import Progress

progressiveDump = True # Set to false for speed, true for quick output
systems = []
counter = 1

with Progress() as progress:
	task = progress.add_task("[cyan]Downloading system data...", total=1)
	while not progress.finished:
		try:
			request = requests.get(f"https://api.spacetraders.io/v2/systems?limit=20&page={counter}")
		except:
			print("Error: Connection error")
			sleep(5)
			continue
		response = request.json()
		if response.get('error'):
			print(f"Error: {response['error']['message']}")
			sleep(1)
			continue
		progress._tasks[task].total = response['meta']['total']
		progress.advance(task, len(response['data']))
		systems.extend(response['data'])
		counter += 1
		sleep(0.4)
		if progressiveDump: json.dump(systems, open('public/systems.json', 'w'))

with open('public/systems.json', 'w') as f:
	json.dump(systems, f)