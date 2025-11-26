// ========== CONFIGURAÇÃO DE CIDADES ==========
let isLoadingOMs = false;
let configCidades = null;
let cidadeAtualIndex = 0;
let intervaloCidades = null;
let navegacaoAutomatica = true;


// Carrega configuração das cidades
async function carregarCidades() {
  try {
    const res = await fetch("/cidades.json", { cache: "no-store" });
    configCidades = await res.json();

    // PRÉ-CACHE AQUI
    await precacheCidades(configCidades.cidades);

    iniciarNavegacao();
  } catch (err) {
    console.error("Erro ao carregar cidades.json:", err);

    configCidades = {
      cidades: [
        {
          nome: "Santa Maria",
          latitude: -29.699146741863114,
          longitude: -53.82797568507067,
          zoom: 13.5,
        },
      ],
      intervaloTroca: 30000,
      duracaoTransicao: 2,
    };

    iniciarNavegacao();
  }
}

// ========== INICIALIZAÇÃO DO MAPA ==========
const inicial = [-29.684, -53.806];
const mapa = L.map("map", {
  zoomControl: false,
  maxZoom: 20,
  minZoom: 4,
  zoomAnimation: false,
  fadeAnimation: false,
  markerZoomAnimation: false,
}).setView(inicial, 13.5);

// Tile escuro
L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
  maxZoom: 20,
  attribution:
    'SIVIR Desenvolvido por <a href="https://github.com/freitasfzw" target="_blank">Zucchetto</a> e <a href="https://github.com/HnrqHolanda" target="_blank">Henrique Holanda</a>',
}).addTo(mapa);

// ======== CLUSTERS ==========
const clusterGroup = L.markerClusterGroup({
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: false,
  spiderfyOnClick: true,
  spiderfyDistanceMultiplier: 2.2,
  maxClusterRadius: 3,
});
mapa.addLayer(clusterGroup);

clusterGroup.on("clusterclick", function (a) {
  a.layer.spiderfy();
  a.originalEvent.preventDefault();
});

// Armazena markers
const markers = new Map();
const enlaceLayer = L.layerGroup().addTo(mapa);

// ========== PRÉ-CACHE DE CIDADES ==========
async function precacheCidades(cidades) {
  console.log("Pré-cache de tiles das cidades iniciado...");

  for (const c of cidades) {
    // cria div temporária (não aparece na tela)
    const div = document.createElement("div");
    div.style.width = "1px";
    div.style.height = "1px";
    div.style.position = "absolute";
    div.style.left = "-9999px";
    document.body.appendChild(div);

    // cria mapa invisível
    const fakeMap = L.map(div, {
      zoomControl: false,
      attributionControl: false,
      fadeAnimation: false,
      zoomAnimation: false,
    }).setView([c.latitude, c.longitude], c.zoom);

    // usa o mesmo tileLayer do mapa principal
    const tile = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      {
        subdomains: "abcd",
        maxZoom: 20,
      }
    ).addTo(fakeMap);

    // espera um pouco para garantir carregamento das tiles
    await new Promise((resolve) => setTimeout(resolve, 1200));

    // remove mapa invisível
    fakeMap.remove();
    div.remove();

    console.log(`Cidade pré-cacheada: ${c.nome}`);
  }

  console.log("Pré-cache concluído.");
}

// ========== NAVEGAÇÃO ENTRE CIDADES ==========
function irParaCidade(index, comTransicao = true) {
  if (!configCidades || !configCidades.cidades.length) return;

  cidadeAtualIndex = index % configCidades.cidades.length;
  const cidade = configCidades.cidades[cidadeAtualIndex];

  // Atualiza o indicador visual
  atualizarIndicadorCidade(cidade.nome);

  // Move o mapa
  if (comTransicao) {
    mapa.flyTo([cidade.latitude, cidade.longitude], cidade.zoom, {
      duration: configCidades.duracaoTransicao || 2,
    });
  } else {
    mapa.setView([cidade.latitude, cidade.longitude], cidade.zoom);
  }
}

function proximaCidade() {
  if (!navegacaoAutomatica) return;
  irParaCidade(cidadeAtualIndex + 1);
}

function cidadeAnterior() {
  navegacaoAutomatica = false;
  pararNavegacaoAutomatica();
  irParaCidade(cidadeAtualIndex - 1);
}

function proximaCidadeManual() {
  navegacaoAutomatica = false;
  pararNavegacaoAutomatica();
  irParaCidade(cidadeAtualIndex + 1);
}

function iniciarNavegacao() {
  // Vai para a primeira cidade
  irParaCidade(0, false);

  // Configura intervalo de troca automática
  if (intervaloCidades) clearInterval(intervaloCidades);
  intervaloCidades = setInterval(
    proximaCidade,
    configCidades.intervaloTroca || 30000
  );
}

function pararNavegacaoAutomatica() {
  if (intervaloCidades) {
    clearInterval(intervaloCidades);
    intervaloCidades = null;
  }
}

function reativarNavegacaoAutomatica() {
  navegacaoAutomatica = true;
  if (intervaloCidades) clearInterval(intervaloCidades);
  intervaloCidades = setInterval(
    proximaCidade,
    configCidades.intervaloTroca || 30000
  );
}

// ========== INTERFACE DE NAVEGAÇÃO ==========
function criarInterfaceNavegacao() {
  const navHTML = `
    <div id="cidadeNavegacao" style="
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1000;
      background: rgba(0, 0, 0, 0.85);
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      gap: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <button id="btnCidadeAnterior" style="
        background: transparent;
        border: 2px solid #fff;
        color: #fff;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
      " title="Cidade anterior">
        ◀
      </button>
      
      <div id="nomeCidadeAtual" style="
        color: #fff;
        font-size: 18px;
        font-weight: 600;
        min-width: 200px;
        text-align: center;
        letter-spacing: 0.5px;
      ">
        Carregando...
      </div>
      
      <button id="btnProximaCidade" style="
        background: transparent;
        border: 2px solid #fff;
        color: #fff;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s;
      " title="Próxima cidade">
        ▶
      </button>
      
      <button id="btnToggleAuto" style="
        background: #0099ff;
        border: none;
        color: #fff;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.3s;
      " title="Ativar/Desativar navegação automática">
        AUTO
      </button>
    </div>
  `;

  document.body.insertAdjacentHTML("afterbegin", navHTML);

  // Event listeners
  document
    .getElementById("btnCidadeAnterior")
    .addEventListener("click", cidadeAnterior);
  document
    .getElementById("btnProximaCidade")
    .addEventListener("click", proximaCidadeManual);
  document
    .getElementById("btnToggleAuto")
    .addEventListener("click", toggleNavegacaoAutomatica);

  // Efeito hover nos botões
  const botoes = document.querySelectorAll("#cidadeNavegacao button");
  botoes.forEach((btn) => {
    btn.addEventListener("mouseenter", function () {
      this.style.transform = "scale(1.1)";
      if (this.id !== "btnToggleAuto") {
        this.style.background = "rgba(255, 255, 255, 0.1)";
      }
    });
    btn.addEventListener("mouseleave", function () {
      this.style.transform = "scale(1)";
      if (this.id !== "btnToggleAuto") {
        this.style.background = "transparent";
      }
    });
  });
}

function atualizarIndicadorCidade(nomeCidade) {
  const elemento = document.getElementById("nomeCidadeAtual");
  if (elemento) {
    elemento.textContent = nomeCidade;
  }
}

function toggleNavegacaoAutomatica() {
  navegacaoAutomatica = !navegacaoAutomatica;
  const btn = document.getElementById("btnToggleAuto");

  if (navegacaoAutomatica) {
    reativarNavegacaoAutomatica();
    btn.style.background = "#0099ff";
    btn.textContent = "AUTO";
  } else {
    pararNavegacaoAutomatica();
    btn.style.background = "#8a8a8a";
    btn.textContent = "MANUAL";
  }
}

// ========== FUNÇÕES ORIGINAIS DO MAPA ==========
// Cria ícone circular da OM
function createOmIcon(fotoUrl, status, size = 64) {
  const color =
    status === "UP" ? "#28a745" : status === "DOWN" ? "#d64545" : "#8a8a8a";

  const html = `
    <div class="om-icon" style="
      width:${size}px;height:${size}px;border-radius:50%;
      border:4px solid ${color};overflow:hidden;
      box-shadow:0 2px 8px rgba(0,0,0,0.6);">
      <img src="${fotoUrl}" onerror="this.src='/assets/fotos/default.jpg'"
        style="width:100%;height:100%;object-fit:cover;">
    </div>
  `;

  return L.divIcon({
    className: "om-div-icon",
    html,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 - 6],
  });
}

// Popup
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

// Insere ou atualiza marker
function upsertMarker(item) {
  if (!item.latitude || !item.longitude) return;

  const key = item.hostname;
  const latlng = [item.latitude, item.longitude];
  const foto = item.foto || "/assets/fotos/default.jpg";
  const icon = createOmIcon(foto, item.status);

  if (markers.has(key)) {
    const m = markers.get(key);
    clusterGroup.removeLayer(m);

    m.setIcon(icon);
    m.setLatLng(latlng);
    m.getPopup().setContent(popupContent(item));

    clusterGroup.addLayer(m);
  } else {
    const m = L.marker(latlng, { icon });
    m.bindPopup(popupContent(item));

    markers.set(key, m);
    clusterGroup.addLayer(m);
  }
}

// Chama API
async function fetchAndUpdate() {
  const loadingBox = document.getElementById("loadingOMs");

  // evita múltiplos popups
  if (!isLoadingOMs) {
    isLoadingOMs = true;
    loadingBox.style.display = "block";
    requestAnimationFrame(() => loadingBox.style.opacity = "1");
  }

  try {
    const res = await fetch("/api/om-status", { cache: "no-store" });
    const data = await res.json();

    // atualiza markers
    data.forEach(upsertMarker);

    // ========= ATUALIZA PAINEL DE MONITORAMENTO =========
    let up = 0;
    let down = 0;

    data.forEach(item => {
      if (item.status === "UP") up++;
      else down++;
    });

    document.getElementById("statUp").textContent = up;
    document.getElementById("statDown").textContent = down;
    document.getElementById("statCheck").textContent =
      new Date().toLocaleTimeString();
    // =====================================================

  } catch (err) {
    console.error("Erro ao carregar /api/om-status:", err);

  } finally {
    isLoadingOMs = false;

    loadingBox.style.opacity = "0";
    setTimeout(() => {
      if (!isLoadingOMs) loadingBox.style.display = "none";
    }, 300);
  }
}


async function fetchEnlaces() {
  try {
    const res = await fetch("/api/enlaces", { cache: "no-store" });
    if (!res.ok) return;

    const enlaces = await res.json();
    enlaceLayer.clearLayers();

    enlaces.forEach((e) => {
      const coords = [
        [e.a.latitude, e.a.longitude],
        [e.b.latitude, e.b.longitude],
      ];

      let color;
      if (e.status !== "OK") color = "#ff0000"; // qualquer problema: vermelho
      else if (e.tipo === "RADIO") color = "#00a2ffff"; // verde
      else if (e.tipo === "FIBRA") color = "#ffff00"; // amarelo
      else if (e.tipo === "AVATO") color = "#ff9100ff"; // laranja
      else color = "#8a8a8a"; // fallback

      const line = L.polyline(coords, { color, weight: 5 }).addTo(enlaceLayer);

      line.bindPopup(`
        <b>${e.a.nome} ⇄ ${e.b.nome}</b><br>
        Tipo: ${e.tipo}<br>
        Status: ${e.status}<br>
        IP remoto: ${e.ipDestino}
      `);
    });
  } catch (err) {
    console.error("Erro /api/enlaces:", err);
  }
}

// ========== INICIALIZAÇÃO ==========
// Cria interface de navegação
criarInterfaceNavegacao();

// Carrega cidades e inicia navegação
carregarCidades();

// Execução inicial + polling das APIs
fetchAndUpdate();
setInterval(fetchAndUpdate, 5000);

fetchEnlaces();
setInterval(fetchEnlaces, 5000);

// Sidebar
document
  .getElementById("toggleSidebar")
  .addEventListener("click", () => sidebar.classList.add("open"));
document
  .getElementById("closeSidebar")
  .addEventListener("click", () => sidebar.classList.remove("open"));
