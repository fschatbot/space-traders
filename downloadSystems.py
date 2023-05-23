import requests, json
from rich.progress import Progress

progressiveDump = False # Set to false for speed, true for quick output
systems = []
counter = 1

with Progress() as progress:
	task = progress.add_task("[cyan]Downloading system data...", total=1)
	while not progress.finished:
		request = requests.get(f"https://api.spacetraders.io/v2/systems?limit=20&page={counter}")
		response = request.json()
		progress._tasks[task].total = response['meta']['total']
		progress.advance(task, len(response['data']))
		systems.extend(response['data'])
		counter += 1
		if progressiveDump: json.dump(systems, open('public/systems.json', 'w'))

with open('public/systems.json', 'w') as f:
	json.dump(systems, f)