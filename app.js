// Basic disaster management map + AI assistant (client-side)

// Map setup
const map = L.map('map', {
	zoomControl: true,
}).setView([20, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Layers
const sheltersLayer = L.layerGroup().addTo(map);
const hazardsLayer = L.layerGroup().addTo(map);
const youLayer = L.layerGroup().addTo(map);

// Mock data
const shelters = [
	{ name: 'Central Shelter', coords: [37.7749, -122.4194], capacity: 250 },
	{ name: 'Riverside Shelter', coords: [34.0522, -118.2437], capacity: 180 },
	{ name: 'Hillview Shelter', coords: [40.7128, -74.006], capacity: 300 },
];

const hazards = [
	{ type: 'Flood', coords: [29.7604, -95.3698], severity: 'High' },
	{ type: 'Wildfire', coords: [38.5816, -121.4944], severity: 'Moderate' },
	{ type: 'Storm', coords: [25.7617, -80.1918], severity: 'High' },
];

function renderShelters() {
	sheltersLayer.clearLayers();
	shelters.forEach((shelter) => {
		L.marker(shelter.coords, { title: shelter.name })
			.bindPopup(`<strong>${shelter.name}</strong><br/>Capacity: ${shelter.capacity}`)
			.addTo(sheltersLayer);
	});
}

function renderHazards() {
	hazardsLayer.clearLayers();
	hazards.forEach((hazard) => {
		const color = hazard.type === 'Wildfire' ? '#ef4444' : hazard.type === 'Flood' ? '#3b82f6' : '#f59e0b';
		L.circle(hazard.coords, { radius: 20000, color, fillColor: color, fillOpacity: 0.25 })
			.bindPopup(`<strong>${hazard.type}</strong><br/>Severity: ${hazard.severity}`)
			.addTo(hazardsLayer);
	});
}

renderShelters();
renderHazards();

// Controls
document.getElementById('toggle-shelters').addEventListener('change', (e) => {
	if (e.target.checked) sheltersLayer.addTo(map); else map.removeLayer(sheltersLayer);
});
document.getElementById('toggle-hazards').addEventListener('change', (e) => {
	if (e.target.checked) hazardsLayer.addTo(map); else map.removeLayer(hazardsLayer);
});
document.getElementById('toggle-you').addEventListener('change', (e) => {
	if (e.target.checked) youLayer.addTo(map); else map.removeLayer(youLayer);
});

document.getElementById('resetViewBtn').addEventListener('click', () => {
	map.setView([20, 0], 2);
});

// Geolocation
let youMarker = null;
function setYou(coords) {
	youLayer.clearLayers();
	youMarker = L.marker(coords, { title: 'You' })
		.bindPopup('<strong>Your Location</strong>')
		.addTo(youLayer);
	map.setView(coords, 12);
}

document.getElementById('locateMeBtn').addEventListener('click', () => {
	if (!navigator.geolocation) {
		alert('Geolocation is not supported by your browser.');
		return;
	}
	navigator.geolocation.getCurrentPosition((pos) => {
		setYou([pos.coords.latitude, pos.coords.longitude]);
	}, () => alert('Unable to retrieve your location.'));
});

// Simple search
document.getElementById('searchInput').addEventListener('keydown', (e) => {
	if (e.key === 'Enter') {
		e.preventDefault();
		const q = e.target.value.toLowerCase().trim();
		if (!q) return;
		const foundShelter = shelters.find(s => s.name.toLowerCase().includes(q));
		const foundHazard = hazards.find(h => h.type.toLowerCase().includes(q));
		const target = foundShelter?.coords || foundHazard?.coords;
		if (target) map.setView(target, 11);
	}
});

// AI Assistant (rule-based client-side)
const aiToggle = document.getElementById('ai-toggle');
const aiPanel = document.getElementById('ai-panel');
const aiClose = document.getElementById('ai-close');
const aiForm = document.getElementById('ai-form');
const aiInput = document.getElementById('ai-input');
const aiLog = document.getElementById('ai-log');

function addAiMessage(text, role = 'ai') {
	const wrapper = document.createElement('div');
	wrapper.className = role === 'ai' ? 'bg-slate-100 rounded-lg p-3' : 'bg-primary-600 text-white rounded-lg p-3 ml-auto max-w-[80%]';
	wrapper.textContent = text;
	aiLog.appendChild(wrapper);
	aiLog.scrollTop = aiLog.scrollHeight;
}

function aiRespond(userText) {
	const text = userText.toLowerCase();
	// intents
	if (text.includes('nearest shelter') || text.includes('closest shelter')) {
		if (!youMarker) return 'Share your location first to find nearby shelters.';
		const youLatLng = youMarker.getLatLng();
		let best = null; let bestDist = Infinity;
		shelters.forEach((s) => {
			const d = map.distance(youLatLng, L.latLng(s.coords));
			if (d < bestDist) { best = s; bestDist = d; }
		});
		if (best) {
			map.setView(best.coords, 13);
			return `Nearest shelter: ${best.name} (~${Math.round(bestDist/1000)} km)`;
		}
	}
	if (text.includes('show shelters')) {
		if (!map.hasLayer(sheltersLayer)) sheltersLayer.addTo(map);
		return 'Showing shelters on the map.';
	}
	if (text.includes('hide shelters')) {
		map.removeLayer(sheltersLayer);
		return 'Hid shelters layer.';
	}
	if (text.includes('show hazards')) {
		if (!map.hasLayer(hazardsLayer)) hazardsLayer.addTo(map);
		return 'Showing hazards on the map.';
	}
	if (text.includes('earthquake') || text.includes('quake')) {
		return 'During earthquakes: Drop, Cover, and Hold On. Stay away from windows. After shaking stops, evacuate if the building is unsafe and expect aftershocks.';
	}
	if (text.includes('flood')) {
		return 'In floods: Turn Around, Don\'t Drown. Move to higher ground. Avoid driving through water. Disconnect electricity if safe.';
	}
	if (text.includes('wildfire') || text.includes('fire')) {
		return 'For wildfires: Prepare a go-bag, create defensible space, monitor air quality, and evacuate early when ordered.';
	}
	if (text.includes('storm') || text.includes('hurricane') || text.includes('cyclone')) {
		return 'For severe storms: Secure outdoor items, stock essentials, stay indoors away from windows, and follow local alerts.';
	}
	if (text.startsWith('zoom to') || text.includes('zoom to')) {
		const m = text.match(/zoom to (\-?\d+\.?\d*),\s*(\-?\d+\.?\d*)/);
		if (m) { map.setView([parseFloat(m[1]), parseFloat(m[2])], 12); return 'Zoomed to coordinates.'; }
	}
	if (text.includes('help') || text.includes('what can you do')) {
		return 'I can: find nearest shelter, show/hide shelters or hazards, zoom to coordinates, and provide safety tips for earthquakes, floods, wildfires, and storms.';
	}
	return 'I can help with shelters, hazards, map view, and safety tips. Try: "nearest shelter", "show hazards" or "zoom to 37.77,-122.42"';
}

aiToggle.addEventListener('click', () => {
	aiPanel.classList.toggle('hidden');
	if (!aiPanel.classList.contains('hidden') && aiLog.childElementCount === 0) {
		addAiMessage('Hi! I can help with shelters, hazards, and safety tips. Ask me anything.');
	}
});
aiClose.addEventListener('click', () => aiPanel.classList.add('hidden'));

aiForm.addEventListener('submit', (e) => {
	e.preventDefault();
	const text = aiInput.value.trim();
	if (!text) return;
	addAiMessage(text, 'user');
	aiInput.value = '';
	setTimeout(() => {
		const reply = aiRespond(text);
		addAiMessage(reply, 'ai');
	}, 200);
});

