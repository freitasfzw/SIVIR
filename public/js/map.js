// ========== CONFIGURAÇÃO DE VARIAVEIS ==========

let configCidades = null;
let cidadeAtualIndex = 0;
let intervaloCidades = null;
let navegacaoAutomatica = false;
let omDownList = [];
let omDownIndex = 0;
let omDownInterval = null;
let cacheOMs = [];
let ultimaAtualizacao = null;
let dashboardImages = []; // armazena os markers criados
let dashboardImagesVisible = false; // controle de visibilidade
let modoManual = false;
let omDownAnterior = 0;
let omIndex = {};          // índice das OMs por hostname/nome
let provedoresCarregados = false;
let autoPause = false;

const enlacesDashboardLayer = L.layerGroup();
const CENTER_DASHBOARD = [-29.805917353708942, -54.910726738178944];
const ZOOM_DASHBOARD = 8;

const providerPosOverride = {
  santa_maria: {
    AVATO: [-29.694502, -53.833952],
    MIDIANET: [-29.686151, -53.811121]
  },
  alegrete: {
    AVATO: [-29.790377, -55.811706],
    MIDIANET: [-29.794213, -55.783339]
  },
  cruz_alta: {
    AVATO: [-28.642163, -53.635168],
    MIDIANET: [-28.652746, -53.598390]
  },
  uruguaiana: {
    AVATO: [-29.774491, -57.084081],
    MIDIANET: [-29.774789, -57.096848]
  },
  santiago: {
    AVATO: [-29.183864, -54.884176],
    MIDIANET: [-29.193418, -54.857740]
  },
  rosario_do_sul: {
    AVATO: [-30.160216, -54.920966],
    STARLINK: [-30.155076, -55.011827]
  },
  itaara: {
    AVATO: [-29.563569, -53.746586]
  },
  sao_gabriel: {
    AVATO: [-30.337565, -54.327307]
  },
  cachoeira_do_sul: {
    AVATO: [-30.051363, -52.898537]
  },
  sao_borja: {
    MIDIANET: [-28.644442, -56.010071],
    STARLINK: [-28.738851532051104, -55.5870006590968]
  },
  itaqui: {
    AVATO: [-29.153620, -56.581485]
  }
};

// -----------------------------------------------------------------------------------------------

// ======= CRIAÇÃO DE DASHBOARDS =======

function criarDashboardFlutuante() {
  // cria somente se não existir
  let wrap = document.getElementById("dashboard-flutuante");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "dashboard-flutuante";
    wrap.style.position = "absolute";
    wrap.style.top = "0";
    wrap.style.left = "0";
    wrap.style.right = "0";
    wrap.style.bottom = "0";
    wrap.style.pointerEvents = "none"; // por padrão não intercepta
    wrap.style.zIndex = "1300";
    wrap.style.display = "none"; // começa oculto
    document.body.appendChild(wrap);
  }
  // sempre recria os setores para limpar estado antigo
  criarSetoresDashboard();
}

function criarSetoresDashboard() {
  const wrap = document.getElementById("dashboard-flutuante");
  if (!wrap) return;

  wrap.innerHTML = "";

  // TOPO
  const top = document.createElement("div");
  top.id = "dash-top";
  Object.assign(top.style, {
    position: "absolute",
    top: "8px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "row",
    gap: "14px",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: "95%",
    overflowX: "visible",
    pointerEvents: "auto",
    zIndex: "1310",
  });

  // FUNDO
  const bottom = document.createElement("div");
  bottom.id = "dash-bottom";
  Object.assign(bottom.style, {
    position: "absolute",
    bottom: "18px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    flexDirection: "row",
    gap: "14px",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    maxWidth: "95%",
    overflowX: "visible",
    pointerEvents: "auto",
    zIndex: "1310",
  });

  // LATERAL ESQUERDA
  const left = document.createElement("div");
  left.id = "dash-left";
  Object.assign(left.style, {
    position: "absolute",
    left: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    width: "240px",
    minWidth: "240px",
    maxWidth: "240px",
    alignItems: "center",
    justifyContent: "center",
    maxHeight: "80vh",
    overflowY: "auto",
    pointerEvents: "auto",
    zIndex: "1310",
  });

  // LATERAL DIREITA
  const right = document.createElement("div");
  right.id = "dash-right";
  Object.assign(right.style, {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    width: "240px",
    minWidth: "240px",
    maxWidth: "240px",
    alignItems: "center",
    justifyContent: "center",
    maxHeight: "80vh",
    overflowY: "auto",
    pointerEvents: "auto",
    zIndex: "1310",
  });

  wrap.appendChild(top);
  wrap.appendChild(left);
  wrap.appendChild(right);
  wrap.appendChild(bottom);
}

criarDashboardFlutuante();

function criarBlocoCidade(nome, lista) {
  const bloco = document.createElement("div");

  bloco.style.padding = "12px";
  bloco.style.borderRadius = "10px";
  bloco.style.background = "rgba(0,0,0,0.55)";
  bloco.style.backdropFilter = "blur(4px)";
  bloco.style.color = "#fff";
  bloco.style.minWidth = "240px";
  bloco.style.maxWidth = "900px";
  bloco.style.textAlign = "center";
  bloco.style.boxShadow = "0 4px 10px rgba(0,0,0,0.4)";
  bloco.style.pointerEvents = "auto";
  bloco.style.overflowX = "hidden";
  bloco.style.overflowY = "hidden";

  const qtd = lista.length;
  const plural = qtd > 1 ? "OMs" : "OM";

  bloco.innerHTML = `
    <strong>${nome.replace(/_/g, " ").toUpperCase()} — ${qtd} ${plural}</strong>
    <br><br>
  `;

  const grid = document.createElement("div");

  // ------- GRID CORRIGIDO -------
  grid.style.display = "grid";
  grid.style.gap = "10px";
  grid.style.justifyContent = "center";
  grid.style.justifyItems = "center";
  grid.style.alignItems = "center";

  // Santa Maria → grid grande
  if (nome.toLowerCase() === "santa_maria") {
    grid.style.gridTemplateColumns = "repeat(9, 1fr)";
    grid.style.maxWidth = "900px";
  }
  // Cidades com 1 OM
  else if (lista.length === 1) {
    grid.style.display = "flex";
    grid.style.flexDirection = "column";
    grid.style.justifyContent = "center";
    grid.style.alignItems = "center";
  }
  // Demais cidades
  else {
    const cols = Math.min(Math.ceil(Math.sqrt(lista.length)), 4);
    grid.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  }

  // ------- ICONES + SIGLA -------
  lista.forEach((item) => {
    const wrapIcon = document.createElement("div");
    wrapIcon.style.display = "flex";
    wrapIcon.style.flexDirection = "column";
    wrapIcon.style.alignItems = "center";
    wrapIcon.style.justifyContent = "center";
    wrapIcon.style.gap = "4px";

    const icone = document.createElement("div");
    icone.style.width = "55px";
    icone.style.height = "55px";
    icone.style.borderRadius = "50%";
    icone.style.border = `3px solid ${item.status === "UP"
      ? "#28a745"
      : item.status === "DOWN"
        ? "#d64545"
        : "#8a8a8a"
      }`;
    icone.style.overflow = "hidden";
    icone.style.cursor = "pointer";
    icone.style.transition = "transform .2s";

    icone.innerHTML = `
      <img src="${item.foto || "/assets/fotos/default.jpg"}"
           style="width:100%;height:100%;object-fit:cover;">
    `;

    icone.onmouseenter = () => (icone.style.transform = "scale(1.15)");
    icone.onmouseleave = () => (icone.style.transform = "scale(1)");

    icone.onclick = () => {
      modoManual = false;
      navegacaoAutomatica = true;

      // atualiza botões AUTO ↔ PAINEL
      document.getElementById("btnToggleAutoMini").style.display = "none";
      document.getElementById("btnBackDashboard").style.display = "block";
      document.getElementById("cidadeNavegacao").style.display = "flex";

      // fecha dashboard
      esconderDashboard();
      pararNavegacaoAutomatica();

      // foca na OM
      mapa.flyTo([item.latitude, item.longitude], 14, { duration: 1.3 });

      // ativa enlaces e OMs normais
      fetchAndUpdate();
      fetchEnlaces();

      setTimeout(() => mapa.invalidateSize(), 150);

      // reinicia navegação automática
      setTimeout(() => iniciarNavegacaoAutomatica(), 30000);
    };

    // SIGLA / QUARTEL
    const label = document.createElement("div");
    label.style.fontSize = "11px";
    label.style.color = "#fff";
    label.style.textShadow = "0 2px 4px rgba(0,0,0,0.6)";
    label.style.maxWidth = "90px";
    label.style.textAlign = "center";
    label.style.lineHeight = "1.1";

    label.innerText = item.nome || "—";

    wrapIcon.appendChild(icone);
    wrapIcon.appendChild(label);

    grid.appendChild(wrapIcon);
  });

  bloco.appendChild(grid);
  return bloco;
}

function renderizarDashboardFlutuante(data) {
  const wrap = document.getElementById("dashboard-flutuante");
  if (!wrap) return;

  // Se estamos em AUTO, ou há OMs caídas, ou o usuário está em modo manual → não mostramos aqui
  if (navegacaoAutomatica || omDownList.length > 0 || modoManual) {
    wrap.style.display = "none";
    return;
  }

  // Delegamos a lógica de mostrar o dashboard para mostrarDashboard()
  // (ela já cuida de adicionar imagens, linhas e desabilitar zoom)
  mostrarDashboard();

  // Limpa setores e recria (garante estado limpo)
  criarSetoresDashboard();

  // Agrupa por cidade/hostgroup
  const cidades = {};
  data.forEach((item) => {
    const grupo = (item.hostgroup || "OUTROS").toLowerCase();
    if (!cidades[grupo]) cidades[grupo] = [];
    cidades[grupo].push(item);
  });

  // ORDEM FIXA que você pediu
  const ordemTopo = ["rosario_do_sul", "itaqui", "itaara", "cachoeira_do_sul"];
  const ordemEsquerda = ["sao_borja", "santiago", "sao_gabriel"];
  const ordemDireita = ["alegrete", "cruz_alta", "uruguaiana"];
  const ordemBottom = ["santa_maria"];

  const dashTop = document.getElementById("dash-top");
  const dashLeft = document.getElementById("dash-left");
  const dashRight = document.getElementById("dash-right");
  const dashBottom = document.getElementById("dash-bottom");

  function add(set, element) {
    set.forEach((nome) => {
      if (!cidades[nome]) return;
      const bloco = criarBlocoCidade(nome, cidades[nome]);
      element.appendChild(bloco);
    });
  }

  // popula painéis
  add(ordemTopo, dashTop);
  add(ordemEsquerda, dashLeft);
  add(ordemDireita, dashRight);
  add(ordemBottom, dashBottom);
}

function mostrarDashboard() {
  // Desabilita interações do mapa no dashboard
  mapa.scrollWheelZoom.disable();
  mapa.touchZoom.disable();
  mapa.doubleClickZoom.disable();
  mapa.boxZoom.disable();
  mapa.keyboard.disable();

  if (modoManual) return; // <<--- impede dashboard aparecer no manual
  // Mostra dashboard se for o modo correto

  if (!navegacaoAutomatica && omDownList.length === 0) {
    document.getElementById("dashboard-flutuante").style.display = "block";
  }

  // Adiciona o marcadores fixos (imgs)
  if (!dashboardImagesVisible) {
    dashboardImages.forEach((m) => m.addTo(mapa));
    dashboardImagesVisible = true;
  }

  // cria as linhas
  criarEnlacesDashboard();
  providerLayer.clearLayers();
  enlacesDashboardLayer.addTo(mapa);
}

function esconderDashboard() {
  // Reativa interações normais no mapa
  mapa.scrollWheelZoom.enable();
  mapa.touchZoom.enable();
  mapa.doubleClickZoom.enable();
  mapa.boxZoom.enable();
  mapa.keyboard.enable();

  // Some painel flutuante
  const wrap = document.getElementById("dashboard-flutuante");
  if (wrap) wrap.style.display = "none";

  // Remove o marcadores fixos
  if (dashboardImagesVisible) {
    dashboardImages.forEach((m) => mapa.removeLayer(m));
    dashboardImagesVisible = false;
  }

  // remove as linhas verdes
  mapa.removeLayer(enlacesDashboardLayer);
  // Recoloca camada de provedores no mapa
  if (!mapa.hasLayer(providerLayer)) {
    mapa.addLayer(providerLayer);
  }
}

// Carrega configuração das cidades
async function carregarCidades() {
  try {
    const res = await fetch("/cidades.json", { cache: "no-store" });
    configCidades = await res.json();

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

// -----------------------------------------------------------------------------------------------

// ========== INICIALIZAÇÃO DO MAPA ==========
const inicial = [-29.699, -53.827];
const mapa = L.map("map", {
  zoomControl: false,
  maxZoom: 20,
  minZoom: 4,
}).setView(inicial, 13.5);

const providerLayer = L.layerGroup().addTo(mapa);

const iconAVATO = L.icon({
  iconUrl: "/assets/fotos/avato_midianet.png",
  iconSize: [64, 64],
  iconAnchor: [30, 30]
});

const iconMIDIANET = L.icon({
  iconUrl: "/assets/fotos/avato_midianet.png",
  iconSize: [64, 64],
  iconAnchor: [30, 30]
});

const iconSTARLINK = L.icon({
  iconUrl: "/assets/fotos/starlink.png",
  iconSize: [64, 64],
  iconAnchor: [30, 30]
});


const dashboardImageConfig = [
  {
    src: "/assets/fotos/DCT.png",
    size: [50, 50],
    coord: [-29.70577088680535, -53.812093940115105], // Santa Maria
    label: "Santa Maria",
  },
  {
    src: "/assets/fotos/alegrete.png",
    size: [50, 50],
    coord: [-29.78787393141398, -55.798685878400875], // Alegrete
    label: "Alegrete",
  },
  {
    src: "/assets/fotos/cruz_alta.png",
    size: [50, 50],
    coord: [-28.648905843373313, -53.61256380315587], // Cruz Alta
    label: "Cruz Alta",
  },
  {
    src: "/assets/fotos/uruguaiana.png",
    size: [50, 50],
    coord: [-29.75274083692223, -57.08766895643805], // Uruguaiana
    label: "Uruguaiana",
  },
  {
    src: "/assets/fotos/santiago.png",
    size: [50, 50],
    coord: [-29.194533839463762, -54.87370334283747], // Santiago
    label: "Santiago",
  },
  {
    src: "/assets/fotos/cachoeira_do_sul.png",
    size: [50, 50],
    coord: [-30.0444524642555, -52.89570999537585], // Cachoeira do Sul
    label: "Cachoeira do Sul",
  },
  {
    src: "/assets/fotos/sao_gabriel.png",
    size: [50, 50],
    coord: [-30.33566739256074, -54.32224724979259], // São Gabriel
    label: "Sao Gabriel",
  },
  {
    src: "/assets/fotos/rosario_do_sul.png",
    size: [50, 50],
    coord: [-30.243724919305574, -54.927791749084136], // Rosario do Sul
    label: "Rosario do Sul",
  },
  {
    src: "/assets/fotos/itaqui.png",
    size: [50, 50],
    coord: [-29.135437515430453, -56.55103175820158], // Itaqui
    label: "Itaqui",
  },
  {
    src: "/assets/fotos/sao_borja.png",
    size: [50, 50],
    coord: [-28.65183133745255, -56.00497850301108], // São Borja
    label: "Sao Borja",
  },
  {
    src: "/assets/fotos/itaara.png",
    size: [50, 50],
    coord: [-29.399946906791477, -53.52644941261851], // Itaara
    label: "Itaara",
  },
];

let dashboardImageVisible = false;
// Tile escuro
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 20,
  attribution:
    'SIVIR Desenvolvido por <a href="https://github.com/freitasfzw" target="_blank">Zucchetto</a> e <a href="https://github.com/HnrqHolanda" target="_blank">Henrique Holanda</a>',
}).addTo(mapa);

// -----------------------------------------------------------------------------------------------

// ========== MARKES DO PAINEL ==========
function criarEnlacesDashboard() {
  if (!configCidades || !configCidades.cidades) return;

  enlacesDashboardLayer.clearLayers();

  // Ache Santa Maria
  const santaMaria = configCidades.cidades.find(
    (c) => c.nome.toLowerCase() === "santa maria"
  );
  if (!santaMaria) return;

  const pontoSM = [santaMaria.latitude, santaMaria.longitude];

  // Para cada cidade, cria uma linha verde saindo de Santa Maria
  configCidades.cidades.forEach((cidade) => {
    if (cidade.nome.toLowerCase() === "santa maria") return;

    const pontoCidade = [cidade.latitude, cidade.longitude];

    const linha = L.polyline([pontoSM, pontoCidade], {
      color: "#000000ff",
      weight: 5,
      opacity: 0.65,
      dashArray: "10, 10", // <<< se quiser pontilhado
      lineJoin: "round",
    });

    enlacesDashboardLayer.addLayer(linha);
  });
}

function criarDashboardImages() {
  dashboardImages = dashboardImageConfig.map((img) => {
    const icon = L.divIcon({
      html: `
  <div style="
    width:${img.size[0]}px;
    text-align:center;
    font-family:Arial, sans-serif;
    pointer-events:none;
    display:flex;
    flex-direction:column;
    align-items:center;
  ">

    <div style="
      width:${img.size[0]}px;
      height:${img.size[1]}px;
      background-image:url(${img.src});
      background-size:contain;
      background-repeat:no-repeat;
      background-position:center;
      margin-bottom:4px;
    "></div>

    <div style="
      color:white;
      font-size:15px;
      font-weight:600;
      padding:4px 10px;
      background:rgba(0,0,0,0.45);
      border-radius:6px;
      text-shadow:0 2px 6px rgba(0,0,0,0.7);
      white-space:nowrap;
    ">
      ${img.label || ""}
    </div>

  </div>
`,

      className: "dashboard-map-icon",
      iconSize: [img.size[0], img.size[1] + 25],
      iconAnchor: [img.size[0] / 2, img.size[1] / 2], // mantém centralizado
    });

    return L.marker(img.coord, { icon, interactive: false });
  });
}

criarDashboardImages();

// -----------------------------------------------------------------------------------------------

// ======== CLUSTERS ==========

const clusterGroup = L.markerClusterGroup({
  spiderfyOnMaxZoom: true,
  showCoverageOnHover: false,
  zoomToBoundsOnClick: false,
  spiderfyOnClick: true,
  spiderfyDistanceMultiplier: 2.2,
  maxClusterRadius: 0,
});
mapa.addLayer(clusterGroup);

clusterGroup.on("clusterclick", function (a) {
  a.layer.spiderfy();
  a.originalEvent.preventDefault();
});

// Armazena markers
const markers = new Map();
const enlaceLayer = L.layerGroup().addTo(mapa);

// -----------------------------------------------------------------------------------------------

// ========== NAVEGAÇÃO ENTRE CIDADES ==========

// garante que config foi carregado
function configPronta() {
  return (
    configCidades &&
    Array.isArray(configCidades.cidades) &&
    configCidades.cidades.length > 0
  );
}

function irParaCidade(index, comTransicao = true) {
  if (!configPronta()) return;

  const lista = configCidades.cidades;
  const len = lista.length;

  cidadeAtualIndex = ((index % len) + len) % len;

  const c = lista[cidadeAtualIndex];

  atualizarIndicadorCidade(c.nome);

  if (comTransicao) {
    mapa.flyTo([c.latitude, c.longitude], c.zoom, {
      duration: configCidades.duracaoTransicao || 2,
    });
  } else {
    mapa.setView([c.latitude, c.longitude], c.zoom);
  }
}

function pararNavegacaoAutomatica() {
  if (intervaloCidades) {
    clearInterval(intervaloCidades);
    intervaloCidades = null;
  }
}

function iniciarNavegacaoAutomatica() {
  if (!configPronta()) return;

  pararNavegacaoAutomatica();
  navegacaoAutomatica = true;

  esconderDashboard();
  mapa.scrollWheelZoom.enable();
  mapa.touchZoom.enable();
  mapa.doubleClickZoom.enable();
  mapa.boxZoom.enable();
  mapa.keyboard.enable();
  irParaCidade(cidadeAtualIndex, false);

  const tempo = configCidades.intervaloTroca || 5000;

  intervaloCidades = setInterval(() => {
    if (!navegacaoAutomatica || autoPause) return;
    irParaCidade(cidadeAtualIndex + 1);
  }, tempo);

  if (!mapa.hasLayer(providerLayer)) {
    mapa.addLayer(providerLayer);
  }

}

function iniciarNavegacao() {
  if (!configPronta()) return;

  if (navegacaoAutomatica) {
    iniciarNavegacaoAutomatica();
  } else {
    pararNavegacaoAutomatica();
    mostrarDashboard();
    mapa.setView(CENTER_DASHBOARD, ZOOM_DASHBOARD);
  }
}

function cidadeAnterior() {
  modoManual = true; // usuário assumiu controle
  esconderDashboard();
  irParaCidade(cidadeAtualIndex - 1);
}

function proximaCidadeManual() {
  modoManual = true;
  esconderDashboard();
  irParaCidade(cidadeAtualIndex + 1);
}

// -----------------------------------------------------------------------------------------------

// ========== INTERFACE DE NAVEGAÇÃO ==========

function criarInterfaceNavegacao() {
  // --- BOTÃO PEQUENO (MODO DASHBOARD) ---
  const miniBtn = document.createElement("button");
  miniBtn.id = "btnToggleAutoMini";
  miniBtn.textContent = "AUTO";
  Object.assign(miniBtn.style, {
    position: "absolute",
    top: "70px",
    left: "15px",
    zIndex: "1999",
    background: "#0099ff",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
    transition: "0.25s",
    display: "block",
  });

  miniBtn.addEventListener(
    "mouseenter",
    () => (miniBtn.style.transform = "scale(1.08)")
  );
  miniBtn.addEventListener(
    "mouseleave",
    () => (miniBtn.style.transform = "scale(1)")
  );
  miniBtn.onclick = () => toggleNavegacaoAutomatica();

  document.body.appendChild(miniBtn);

  // --- BOTÃO EXTRA (RETORNAR AO DASHBOARD) ---
  const miniBack = document.createElement("button");
  miniBack.id = "btnBackDashboard";
  miniBack.textContent = "PAINEL";
  Object.assign(miniBack.style, {
    position: "absolute",
    top: "70px",
    left: "15px",
    zIndex: "1999",
    background: "#444",
    color: "#fff",
    border: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    boxShadow: "0 4px 10px rgba(0,0,0,0.4)",
    transition: "0.25s",
    display: "none",
  });

  miniBack.addEventListener(
    "mouseenter",
    () => (miniBack.style.transform = "scale(1.08)")
  );
  miniBack.addEventListener(
    "mouseleave",
    () => (miniBack.style.transform = "scale(1)")
  );

  miniBack.onclick = () => {
    navegacaoAutomatica = false;
    pararNavegacaoAutomatica();
    modoManual = false;
    mostrarDashboard();
    mapa.setView(CENTER_DASHBOARD, ZOOM_DASHBOARD);

    document.getElementById("cidadeNavegacao").style.display = "none";

    miniBack.style.display = "none";
    miniBtn.style.display = "block";
  };

  document.body.appendChild(miniBack);

  // --- INTERFACE COMPLETA (SÓ NO MODO AUTO) ---
  const navHTML = `
    <div id="cidadeNavegacao" style="
      position: absolute;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 3000;
      background: rgba(0, 0, 0, 0.85);
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
      display: none;
      align-items: center;
      gap: 16px;
    ">
      <button id="btnCidadeAnterior" class="navBtn"><</button>
      <div id="nomeCidadeAtual" style="color:#fff;font-size:18px;font-weight:600;min-width:200px;text-align:center;">
        Carregando...
      </div>
      <button id="btnProximaCidade" class="navBtn">></button>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", navHTML);

  // estiliza botões
  document.querySelectorAll(".navBtn").forEach((btn) => {
    Object.assign(btn.style, {
      background: "transparent",
      border: "2px solid #fff",
      color: "#fff",
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      cursor: "pointer",
      fontSize: "18px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "0.3s",
    });
    btn.addEventListener(
      "mouseenter",
      () => (btn.style.transform = "scale(1.1)")
    );
    btn.addEventListener(
      "mouseleave",
      () => (btn.style.transform = "scale(1)")
    );
  });

  const btnPause = document.createElement("button");
  btnPause.id = "btnPauseAuto";
  btnPause.textContent = "II"; // símbolo pause
  Object.assign(btnPause.style, {
    background: "transparent",
    border: "2px solid #fff",
    color: "#fff",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
  });

  btnPause.onclick = () => togglePauseAuto();

  document.getElementById("cidadeNavegacao").appendChild(btnPause);


  // listeners
  document.getElementById("btnCidadeAnterior").onclick = cidadeAnterior;
  document.getElementById("btnProximaCidade").onclick = proximaCidadeManual;
}

function atualizarIndicadorCidade(nomeCidade) {
  const elemento = document.getElementById("nomeCidadeAtual");
  if (elemento) elemento.textContent = nomeCidade;
}

async function toggleNavegacaoAutomatica() {
  navegacaoAutomatica = !navegacaoAutomatica;

  const miniBtn = document.getElementById("btnToggleAutoMini");
  const miniBack = document.getElementById("btnBackDashboard");
  const barra = document.getElementById("cidadeNavegacao");

  // ============================
  // ATIVANDO AUTO
  // ============================
  if (navegacaoAutomatica) {
    modoManual = false;
    autoPause = false;

    miniBtn.style.display = "none";
    miniBack.style.display = "block";
    barra.style.display = "flex";

    esconderDashboard();
    pararNavegacaoAutomatica();

    // posiciona na cidade atual
    irParaCidade(cidadeAtualIndex, false);

    // 🔥 PROVEDORES — PRIMEIRA CARGA OU RECARREGA APÓS DASHBOARD
    providerLayer.clearLayers();

    await carregarProvedores();
    provedoresCarregados = true;

    if (!mapa.hasLayer(providerLayer)) {
      mapa.addLayer(providerLayer);
    }

    // LOOP AUTOMÁTICO
    intervaloCidades = setInterval(() => {
      if (!navegacaoAutomatica || autoPause) return;
      irParaCidade(cidadeAtualIndex + 1);
    }, configCidades.intervaloTroca || 5000);

    return;
  }

  // ============================
  // DESATIVANDO AUTO -> VOLTA Painel
  // ============================
  modoManual = false;
  autoPause = false;

  pararNavegacaoAutomatica();

  miniBack.style.display = "none";
  miniBtn.style.display = "block";
  barra.style.display = "none";

  mostrarDashboard();
  mapa.setView(CENTER_DASHBOARD, ZOOM_DASHBOARD);
}

function togglePauseAuto() {
  if (!navegacaoAutomatica || omDownList.length > 0) return;

  autoPause = !autoPause;

  const btn = document.getElementById("btnPauseAuto");

  if (autoPause) {
    // muda ícone
    btn.textContent = "▶";
    pararNavegacaoAutomatica();
  } else {
    btn.textContent = "II";
    iniciarNavegacaoAutomatica();
  }
}

function reiniciarRotacaoSeNaoPausado() {
  if (!autoPause) {
    pararNavegacaoAutomatica();
    iniciarNavegacaoAutomatica();
  }
}

function restaurarBotaoPause() {
  const btn = document.getElementById("btnPauseAuto");
  if (!btn) return;

  btn.disabled = false;
  btn.style.opacity = "1";
  btn.style.cursor = "pointer";
  btn.textContent = autoPause ? "▶" : "II";
}
// -----------------------------------------------------------------------------------------------

// ========== FUNÇÕES ORIGINAIS DO MAPA ==========

// Cria ícone circular da OM
function createOmIcon(fotoUrl, status, size = 64) {
  const color =
    status === "UP" ? "#28a745" : status === "DOWN" ? "#d64545" : "#8a8a8aff";

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

// Aviso OM Down
function criarAvisoOM() {
  const aviso = document.createElement("div");
  aviso.id = "avisoOM";
  aviso.style.position = "absolute";
  aviso.style.bottom = "0";
  aviso.style.left = "0";
  aviso.style.right = "0";
  aviso.style.padding = "12px 20px";
  aviso.style.background = "rgba(255, 0, 0, 0.9)";
  aviso.style.animation = "avisoBlink 1.2s infinite";
  aviso.style.color = "#000";
  aviso.style.fontWeight = "600";
  aviso.style.fontSize = "16px";
  aviso.style.textAlign = "center";
  aviso.style.zIndex = "1998";
  aviso.style.display = "none";
  aviso.style.boxShadow = "0 2px 10px rgba(0,0,0,0.4)";
  aviso.style.fontFamily =
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  aviso.textContent =
    "Atenção: indisponibilidade de rede detectada na OM a seguir.";

  document.body.appendChild(aviso);
}

function desativarBotoesPainel() {
  const autoBtn = document.getElementById("btnToggleAutoMini");
  const painelBtn = document.getElementById("btnBackDashboard");

  [autoBtn, painelBtn].forEach((btn) => {
    if (!btn) return;
    btn.style.pointerEvents = "none";
    btn.style.opacity = "0.35";
    btn.style.cursor = "not-allowed";
  });
}

function ativarBotoesPainel() {
  const autoBtn = document.getElementById("btnToggleAutoMini");
  const painelBtn = document.getElementById("btnBackDashboard");

  [autoBtn, painelBtn].forEach((btn) => {
    if (!btn) return;
    btn.style.pointerEvents = "auto";
    btn.style.opacity = "1";
    btn.style.cursor = "pointer";
  });
}

function atualizarPainelOMDown(lista) {
  const painel = document.getElementById("painel-om-down");
  const container = document.getElementById("lista-om-down");

  if (!painel || !container) return;

  // se não há OM caída → esconde painel
  if (lista.length === 0) {
    painel.style.display = "none";
    container.innerHTML = "";
    return;
  }

  painel.style.display = "flex";

  container.innerHTML = "";

  lista.forEach((om) => {
    const card = document.createElement("div");
    card.className = "om-down-card";

    card.innerHTML = `
      <img src="${om.foto || "/assets/fotos/default.jpg"}">
      <div class="om-down-info">
        <strong>${om.nome}</strong>
        <small>${om.hostname}</small>
        ${om.ip ? `<small>IP: ${om.ip}</small>` : ""}
        <small>Status: ${om.status}</small>
        <small>Última verificação: ${om.last_check || "—"}</small>
      </div>
    `;

    container.appendChild(card);
  });
}

function mostrarAvisoConexaoRestabelecida() {
  const okBox = document.getElementById("avisoOMGreen");
  if (!okBox) return;

  okBox.style.display = "block";
  okBox.style.opacity = "1";

  setTimeout(() => {
    okBox.style.opacity = "0";
  }, 1500); // começa fade após 1.5s

  setTimeout(() => {
    okBox.style.display = "none";
  }, 2000); // some totalmente em 2s
}

criarAvisoOM();


function addProviderMarkers(data) {
  for (const cidade of Object.keys(data)) {
    const { pos, redes } = data[cidade];

    if (redes.AVATO?.length)
      createProviderMarker("AVATO", cidade, pos, redes.AVATO);

    if (redes.MIDIANET?.length)
      createProviderMarker("MIDIANET", cidade, pos, redes.MIDIANET);

    if (redes.STARLINK?.length)
      createProviderMarker("STARLINK", cidade, pos, redes.STARLINK);
  }
}

function getProviderColor(status, tipo) {
  // igual ao padrão do sistema
  switch (status) {
    case "CRITICAL": return "#ff0000";  // Vermelho
    case "WARNING": return "#ffcc00";  // Amarelo
    case "UNKNOWN": return "#666666";  // Cinza
    case "OK":
    default:
      return tipo === "AVATO" ? "#ff9100" : "#a255ff";
  }
}

function createProviderMarker(tipo, cidade, posDefault, enlaces) {
  const pos = providerPosOverride[cidade]?.[tipo] || posDefault;

  // Logos corretas para cada provedor
  const providerLogo = {
    AVATO: "/assets/fotos/avato_midianet.png",
    MIDIANET: "/assets/fotos/avato_midianet.png",
    STARLINK: "/assets/fotos/starlink.png"
  };

  // Nome exibido = próprio tipo
  const label = tipo;

  const icon = L.divIcon({
    className: "provider-icon",
    iconSize: [64, 80],
    iconAnchor: [32, 32],
    html: `
      <div style="
        display:flex;
        flex-direction:column;
        align-items:center;
        justify-content:center;
        pointer-events:none;
        transform: translateY(-8px);
      ">
        <div style="
          width:64px;
          height:64px;
          background-image:url('${providerLogo[tipo]}');
          background-size:contain;
          background-repeat:no-repeat;
          background-position:center;
        "></div>

        <div style="
          margin-top:2px;
          padding:2px 8px;
          background:rgba(0,0,0,0.7);
          color:#fff;
          font-size:12px;
          font-weight:600;
          border-radius:4px;
          white-space:nowrap;
          text-shadow:0 2px 4px rgba(0,0,0,0.6);
        ">
          ${label}
        </div>
      </div>
    `
  });

  // Marker na posição do provedor
  const marker = L.marker(pos, { icon, interactive: false }).addTo(providerLayer);

  // Enlaces -> OM
  enlaces.forEach(e => {
    const dest = omIndex[e.om];
    if (!dest) return;

    const cor = getProviderColor(e.status, tipo);

    L.polyline(
      [pos, [dest.latitude, dest.longitude]],
      {
        color: cor,
        weight: 8,
        opacity: 0.9,
        dashArray: e.status === "CRITICAL" ? "0" : "10 10"
      }
    ).addTo(providerLayer);
  });
}

async function carregarProvedores() {

  // 🚫 Dashboard ativo? → Não renderiza provedores
  if (!navegacaoAutomatica && omDownList.length === 0) {
    providerLayer.clearLayers();
    return;
  }

  try {
    const res = await fetch("/api/provedores", { cache: "no-store" });
    const data = await res.json();
    providerLayer.clearLayers();
    addProviderMarkers(data);
  } catch (e) {
    console.warn("Erro ao carregar provedores:", e);
  }
}

// Chama API
async function fetchAndUpdate() {
  const aviso = document.getElementById("avisoOM");

  try {
    const res = await fetch("/api/om-status", { cache: "no-store" });
    const data = await res.json();

    // monta índice de OMs para uso pelos provedores
    omIndex = {};
    data.forEach(item => {
      if (item.hostname)
        omIndex[item.hostname] = item;
    });

    carregarProvedores();
    renderizarDashboardFlutuante(data);

    if (!navegacaoAutomatica && omDownList.length === 0) {
      // no dashboard → limpa tudo
      clusterGroup.clearLayers();
      enlaceLayer.clearLayers();
    } else {
      // em navegação OU modo crítico → mostra OM
      data.forEach(upsertMarker);
    }

    // ==== DETECÇÃO DE OM FORA ====
    const omExcecoes = ["CICA"];

    const novasQuedas = data.filter(
      (item) => item.status !== "UP" && !omExcecoes.includes(item.hostname)
    );

    // Atualiza lista global
    omDownList = novasQuedas;
    atualizarPainelOMDown(omDownList);

    // ======== ALERTA SONORO ========
    if (omDownList.length > omDownAnterior && omDownList.length > 0) {
      const audio = document.getElementById("alertSound");
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {
          console.warn("Som bloqueado até interação do usuário.");
        });
      }
    }

    // Atualiza contador para o próximo ciclo
    omDownAnterior = omDownList.length;
    // =================================

    if (omDownList.length > 0) {

      if (!provedoresCarregados) {
        carregarProvedores();
        provedoresCarregados = true;
      }

      autoPause = false;

      const btnPause = document.getElementById("btnPauseAuto");
      if (btnPause) {
        btnPause.disabled = true;
        btnPause.style.opacity = "0.3";
        btnPause.style.cursor = "not-allowed";
      }

      desativarBotoesPainel();
      esconderDashboard();

      omDownList.forEach(upsertMarker);
      focarOMsFora();

      if (aviso) aviso.style.display = "block";
    } else {
      // ======== OMs voltaram ao normal ========
      ativarBotoesPainel();
      if (aviso) aviso.style.display = "none";

      // === EXIBE O AVISO VERDE APENAS SE SAIU DO ESTADO DOWN ===
      if (omDownAnterior > 0) {
        mostrarAvisoConexaoRestabelecida();
      }

      // encerra o loop de foco em OM down
      if (omDownInterval) {
        clearInterval(omDownInterval);
        omDownInterval = null;
      }

      // limpa indicadores de alerta
      omDownIndex = 0;

      // -------- MODO MANUAL OU DASHBOARD --------
      if (!navegacaoAutomatica) {
        // LIMPA TUDO DO MODO CRÍTICO
        clusterGroup.clearLayers();
        enlaceLayer.clearLayers();

        // Remove markers que foram adicionados no modo crítico
        markers.forEach((marker) => {
          if (mapa.hasLayer(marker)) mapa.removeLayer(marker);
        });

        // Remove enlaces automáticos do dashboard
        mapa.removeLayer(enlacesDashboardLayer);

        // Exibe o dashboard limpo
        mostrarDashboard();

        // Coloca markers fixos do dashboard
        dashboardImages.forEach((m) => m.addTo(mapa));

        // Recria as linhas azuis do dashboard
        criarEnlacesDashboard();
        enlacesDashboardLayer.addTo(mapa);

        // Centraliza no dashboard
        mapa.setView(CENTER_DASHBOARD, ZOOM_DASHBOARD);

        return;
      }

      // -------- MODO AUTOMÁTICO --------
      esconderDashboard();
      data.forEach(upsertMarker);

      // reinicia rotação se estava parada
      if (!autoPause) iniciarNavegacaoAutomatica();

    }

    // ========= ATUALIZA PAINEL =========
    let up = 0;
    let down = 0;

    data.forEach((item) => {
      if (item.status === "UP") up++;
      else down++;
    });

    document.getElementById("statUp").textContent = up;
    document.getElementById("statDown").textContent = down;
    document.getElementById("statCheck").textContent =
      new Date().toLocaleTimeString();
    // ==================================
  } catch (err) {
    console.error("Erro ao carregar /api/om-status:", err);
  }
}

function offsetLatLng([lat, lng], offsetMeters) {
  // desloca em metros na latitude (111.320m ≈ 1 grau)
  const latOff = offsetMeters / 5000;
  return [lat + latOff, lng];
}


async function fetchEnlaces() {
  try {
    const res = await fetch("/api/enlaces", { cache: "no-store" });
    if (!res.ok) return;

    const enlaces = await res.json();

    // Se está no modo painel, não mostra
    if (!navegacaoAutomatica && omDownList.length === 0) {
      enlaceLayer.clearLayers();
      return;
    }

    enlaceLayer.clearLayers();

    // 🔥 agrupa enlaces por par OM-A <-> OM-B
    const grupos = {};
    enlaces.forEach(e => {
      const key = [e.a.hostname, e.b.hostname].sort().join("_");
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(e);
    });

    // desenha
    Object.values(grupos).forEach((lista) => {
      lista.forEach((e, idx) => {

        const coords = [
          [e.a.latitude, e.a.longitude],
          [e.b.latitude, e.b.longitude],
        ];

        let options = {
          color: "#00a2ff",
          weight: 5,
          dashArray: "15, 15",
          opacity: 0.8,
        };

        // ===== ESTILO =====
        switch (true) {
          case e.status !== "OK":
            options.color = "#ff0000";
            options.dashArray = "0 0";
            break;
          case e.tipo === "RADIO":
            options.color = "#00a2ff";
            options.dashArray = "15 15";
            break;
          case e.tipo === "FIBRA":
            options.color = "#ffff00";
            options.dashArray = "0 0";
            break;
          case e.tipo === "AVATO":
            options.color = "#ff9100";
            options.dashArray = "0 0";
            break;
          case e.tipo == "MIDIANET":
            options.color = "#ff9100";
            options.dashArray = "0 0";
            break;
          case e.tipo == "STARLINK":
            options.color = "#0004ffff";
            options.dashArray = "0 0";
            break;
        }

        // ===== OFFSET =====
        const shift = idx * 6;
        const coordsShift = [
          offsetLatLng(coords[0], shift),
          offsetLatLng(coords[1], shift),
        ];

        const line = L.polyline(coordsShift, options).addTo(enlaceLayer);

        line.bindPopup(`
          <b>${e.a.nome} ⇄ ${e.b.nome}</b><br>
          Tipo: ${e.tipo}<br>
          Status: ${e.status}<br>
          IP remoto: ${e.ipDestino}
        `);
      });
    });

  } catch (err) {
    console.error("Erro /api/enlaces:", err);
  }
}

function focarOMsFora() {
  if (omDownList.length === 0) return;

  // Impede navegação automática e dashboard
  navegacaoAutomatica = false;
  modoManual = false;
  esconderDashboard();

  // Cancela navegação normal
  pararNavegacaoAutomatica();

  // Se já estamos em loop de OM down, deixa rodar
  if (omDownInterval) return;

  // Começa loop entre OMs com problema
  omDownIndex = 0;

  function focarProximaOM() {
    if (omDownList.length === 0) {
      clearInterval(omDownInterval);
      omDownInterval = null;
      return;
    }

    const om = omDownList[omDownIndex];
    omDownIndex = (omDownIndex + 1) % omDownList.length;

    if (om && om.latitude && om.longitude) {
      mapa.flyTo([om.latitude, om.longitude], 15, { duration: 1.2 });

      // Recria os markers normalmente
      upsertMarker(om);
    }
  }

  // Foca imediatamente
  focarProximaOM();

  // Depois roda ciclo a cada 6 segundos (ajusta se quiser)
  omDownInterval = setInterval(focarProximaOM, 6000);
}

// -----------------------------------------------------------------------------------------------

// ========== INICIALIZAÇÃO ==========

// Cria interface de navegação
criarInterfaceNavegacao();

// Carrega cidades e inicia navegação
carregarCidades();

// Execução inicial + polling das APIs
fetchAndUpdate();
setInterval(fetchAndUpdate, 1000);

fetchEnlaces();
setInterval(fetchEnlaces, 1000);

// Sidebar
document
  .getElementById("toggleSidebar")
  .addEventListener("click", () => sidebar.classList.add("open"));
document
  .getElementById("closeSidebar")
  .addEventListener("click", () => sidebar.classList.remove("open"));

// -----------------------------------------------------------------------------------------------
