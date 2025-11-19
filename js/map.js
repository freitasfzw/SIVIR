// js/map.js

// Coordenada inicial (ajuste se quiser)
const inicial = [-29.684, -53.806]; // centraliza em Santa Maria
const mapa = L.map("map", { zoomControl: false }).setView(inicial, 11);

// Tile (Stadia smooth dark)
L.tileLayer("https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png", {
  maxZoom: 20,
  attribution: 'Desenvolvido por <a href="https://github.com/HnrqHolanda" target="_blank">Henrique Holanda</a> e <a href="https://github.com/freitasfzw" target="_blank">Zucchetto</a> — Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
}).addTo(mapa);

// armazena markers por hostname
const markers = new Map();

function createOmIcon(fotoUrl, status, size = 64) {
  const color = status === "UP" ? "#28a745" : (status === "DOWN" ? "#d64545" : "#8a8a8a");
  const html = `
    <div class="om-icon" style="width:${size}px;height:${size}px;border-radius:50%;border:4px solid ${color};overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.6);">
      <img src="${fotoUrl}" onerror="this.src='/assets/fotos/default.jpg'" style="width:100%;height:100%;object-fit:cover;display:block;">
    </div>
  `;
  return L.divIcon({
    className: "om-div-icon",
    html,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2 - 6]
  });
}

function popupContent(item) {
  return `
    <div style="min-width:200px">
      <strong>${item.nome}</strong><br/>
      <small>${item.hostname} ${item.ip ? "• " + item.ip : ""}</small><br/>
      <b>Status:</b> ${item.status}<br/>
      <b>Última verificação:</b> ${item.last_check || "—"}
    </div>
  `;
}

function upsertMarker(item) {
  if (!item.latitude || !item.longitude) return;
  const key = item.hostname;
  const latlng = [item.latitude, item.longitude];
  const foto = item.foto || "/assets/fotos/default.jpg";
  const icon = createOmIcon(foto, item.status);

  if (markers.has(key)) {
    const m = markers.get(key);
    m.setIcon(icon);
    m.setLatLng(latlng);
    if (m.getPopup()) m.getPopup().setContent(popupContent(item));
  } else {
    const m = L.marker(latlng, { icon });
    m.bindPopup(popupContent(item));
    m.addTo(mapa);
    markers.set(key, m);
  }
}

async function fetchAndUpdate() {
  try {
    const res = await fetch("/api/om-status", { cache: "no-store" });
    if (!res.ok) throw new Error("API error " + res.status);
    const data = await res.json();
    data.forEach(upsertMarker);
  } catch (err) {
    console.error("Erro ao buscar /api/om-status:", err);
  }
}

// primeira vez
fetchAndUpdate();
// polling (30s)
setInterval(fetchAndUpdate, 30_000);

// Sidebar controls (abre/fecha)
const sidebar = document.getElementById("sidebar");
const toggleBtn = document.getElementById("toggleSidebar");
const closeBtn = document.getElementById("closeSidebar");
toggleBtn.addEventListener("click", () => sidebar.classList.add("open"));
closeBtn.addEventListener("click", () => sidebar.classList.remove("open"));
