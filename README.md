# Space Traders

## Description

This a complete control dashboard for the API game [Space-Traders](https://spacetraders.io/). As time goes on, more features will be added to this dashboard and it will be made more sofisticated and automated (though the automation is long-term goal).

## How to run

1. Clone the repo `git clone https://github.com/fschatbot/space-traders.git`
2. Install Python Dependencies `pip install requests rich`
3. Download the System Map `python downloadSystems.py`
4. Install webpage dependencies `npm clean-install`
5. Run the app `npm start`
6. Visit `http://localhost:3005/`

## Features

- [x] Login/Register
  - [ ] UI friendly
- [ ] Contracts
  - [x] View Details
  - [x] Accept Contracts
  - [ ] Monitor Progress
  - [ ] Collection of rewards
- [ ] Ships
  - [x] View Details
  - [x] View Cargo (Allow for ejection)
  - [x] Refuel (If Possible)
  - [x] Location, Destination (setting and viewing), Duration
  - [x] Mining (If possible)
  - [x] Switching ship modes
  - [ ] Delivering Cargo for contracts
  - [x] Switching between Orbiting and Docking
- [ ] Shipyard
  - [ ] Search for systems
    - [ ] Show system from contracts
  - [ ] Show recently searched systems
  - [x] Viewing shipyards inside the chosen system
  - [x] Buying ships from the shop
- [ ] Market Place
  - [ ] Search for systems
    - [ ] Suggest systems in which certain ships are presenet
  - [ ] Show recently searched systems
  - [ ] Viewing market place inside the chosen system
  - [ ] Buying/Selling goods from the market place (if ship is present)
- [ ] Map
  - [ ] Interactive map (Move throught dragging, Zoom in/out through scrolling, limit the zooming out to 1.25 times the maximum veritical distance)
  - [ ] Location Finder (Drop down search recommendations)
  - [ ] Clicking on a system switches from System Map to Waypoint Map
    - [ ] Includes the ships if they are inside
  - [ ] Clicking on a waypoint will show information regarding it below the map canvas
  - [ ] Ships will show their path between waypoints
  - [ ] Ships will show their path between systems
  - [ ] After a certain threshold of zooming in, the names of the systems will be visible
  - [ ] Right-Clicking will zoom in till the names are visible
- [ ] Space API
  - [x] Has all the endpoints (as of 5/22/2023)
    - [x] https://docs.spacetraders.io/
    - [x] https://spacetraders.stoplight.io/docs/spacetraders/
  - [ ] Type-Script (Not part of the foreseable future)
  - [x] Session Storage of response data (error or not)
  - [x] Global Access to these functions and variables (in console)
  - [x] Power to overide endpoint data
  - [ ] Inbuilt pagination (limit, page, ALL)
  - [ ] Inbuilt error handling (certain extent) and error toast (optional)
  - [ ] Caching certain responses in IndexedDB (optional: adding expiration time)
  - [ ] `No-Token` Error Handling
  - [x] Rate Limiting (Optional)
  - [ ] Checking if the endpoint can even be executed (highly optional)
  - [ ] Implement System and Waypoint Verification
  - [ ] React Hook for the API
- [ ] Automation
  - [ ] Auto-accepting and fulfilling contracts
  - [ ] Auto-mining till cargo is full or a goal is reached
  - [ ] Auto-switching between flight mode depending on the distance and fuel
  - [ ] Auto-refueling if coin consumption is less than 1%.
- [ ] General
  - [ ] Showcasing Name and Credits in Navbar
  - [ ] Icons for almost everything
  - [ ] Nice Themes and UX (Dark Mode Only)
  - [ ] Icon and title
  - [ ] Proper Manifest (Highly optional)
  - [ ] Basic Meta data
