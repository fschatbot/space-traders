import requests, json
from rich.progress import Progress


systems = []
counter = 1

with Progress() as progress:
	task = progress.add_task("[cyan]Downloading system data...", total=1)
	while not progress.finished:
		request = requests.get(f"https://api.spacetraders.io/v2/systems?limit=20&page={counter}")
		response = request.json()
		progress._tasks[task].total = response['meta']['total']
		progress.advance(task, len(response['data']))
		counter += 1

with open('public/systems.json', 'w') as f:
	json.dump(systems, f)