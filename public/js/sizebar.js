// sizebar.js — versão robusta para o sidebar dinâmico
(function () {
  // Segurança: garante que o DOM esteja parseado (defer já faz isso, mas é bom ter)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    // Referências seguras (verifica existência antes de usar)
    const sidebar = document.getElementById("sidebar");
    const sidebarContent = document.getElementById("sidebar-content");

    const btnToggle = document.getElementById("toggleSidebar");
    const btnClose = document.getElementById("closeSidebar");

    const menuAddOM = document.getElementById("menuAddOM");
    const menuAddEnlace = document.getElementById("menuAddEnlace");
    const menuMonitoramento = document.getElementById("menuMonitoramento");
    const menuFiltros = document.getElementById("menuFiltros");

    const telaAddOM = document.getElementById("telaAddOM");
    const telaAddEnlace = document.getElementById("telaAddEnlace");
    const telaMonitoramento = document.getElementById("telaMonitoramento");
    const telaFiltros = document.getElementById("telaFiltros");

    // Campos de latitude/longitude (form OM)
    const inputLat = document.getElementById("latitude");
    const inputLng = document.getElementById("longitude");
    const btnMapPick = document.getElementById("btnMapPick");
    const pickHint = document.getElementById("pickHint");

    // Segurança mínima: se algum elemento crucial não existir, loga e retorna
    if (!sidebar || !sidebarContent) {
      console.error("sizebar.js: elementos #sidebar ou #sidebar-content não encontrados.");
      return;
    }

    // função utilitária para esconder todas as telas
    function esconderTelas() {
      const sections = sidebarContent.querySelectorAll(".content-section");
      sections.forEach(s => s.classList.remove("active"));
    }

    // Abre sidebar
    if (btnToggle) {
      btnToggle.addEventListener("click", () => {
        sidebar.classList.add("open");
      });
    }

    // Fecha sidebar
    if (btnClose) {
      btnClose.addEventListener("click", () => {
        sidebar.classList.remove("open");
      });
    }

    // Função para ativar uma tela específica
    function abrirTela(telaEl) {
      if (!telaEl) {
        console.warn("sizebar.js: tela não encontrada ao tentar abrir:", telaEl);
        return;
      }
      sidebar.classList.add("open");
      esconderTelas();
      telaEl.classList.add("active");
      // rola para topo do conteúdo para evitar posição estranha
      if (sidebarContent) sidebarContent.scrollTop = 0;
    }

    // Conecta os menus com as telas
    if (menuAddOM) menuAddOM.addEventListener("click", () => abrirTela(telaAddOM));
    if (menuAddEnlace) menuAddEnlace.addEventListener("click", () => abrirTela(telaAddEnlace));
    if (menuMonitoramento) menuMonitoramento.addEventListener("click", () => abrirTela(telaMonitoramento));
    if (menuFiltros) menuFiltros.addEventListener("click", () => abrirTela(telaFiltros));

    // Se quiser: abrir uma tela padrão ao carregar (por exemplo Monitoramento)
    // abrirTela(telaMonitoramento);

    // ===========================
    //  Seleção de coordenadas no mapa
    // ===========================
    // Variáveis de estado
    let picking = false;
    let pickMarker = null;

    // Garante que "mapa" exista (definido no map.js)
    function hasMapa() {
      return typeof mapa !== "undefined" && mapa !== null;
    }

    // Ativa modo picking
    if (btnMapPick) {
      btnMapPick.addEventListener("click", () => {
        if (!hasMapa()) {
          console.warn("sizebar.js: mapa ainda não inicializado. Tente novamente em alguns instantes.");
          return;
        }

        // Fecha sidebar para facilitar clique no mapa
        sidebar.classList.remove("open");

        picking = true;
        if (pickHint) pickHint.style.display = "block";

        // muda cursor do mapa (se possível)
        try { mapa.getContainer().style.cursor = "crosshair"; } catch (e) { /* ignore */ }
      });
    }

    // Lida com clique no mapa para pegar coordenadas
    if (hasMapa()) {
      mapa.on("click", (e) => {
        if (!picking) return;

        const lat = e.latlng.lat;
        const lng = e.latlng.lng;

        // Preenche inputs se existirem
        if (inputLat) inputLat.value = lat.toFixed(6);
        if (inputLng) inputLng.value = lng.toFixed(6);

        // Remove marker anterior e adiciona novo
        try {
          if (pickMarker) mapa.removeLayer(pickMarker);
          pickMarker = L.marker([lat, lng], { interactive: false }).addTo(mapa);
        } catch (err) {
          console.warn("sizebar.js: não foi possível criar marker de pick:", err);
        }

        // Sai do modo picking
        picking = false;
        if (pickHint) pickHint.style.display = "none";
        try { mapa.getContainer().style.cursor = ""; } catch (e) { /* ignore */ }

        // Reabre sidebar mostrando a tela AddOM (onde os inputs estão)
        abrirTela(telaAddOM);
      });
    } else {
      // Se o mapa ainda não existe quando o script rodou, tentamos reconectar depois
      // (map.js provavelmente define `mapa` global). Observador simples:
      let attempts = 0;
      const waitMapa = setInterval(() => {
        attempts++;
        if (hasMapa()) {
          clearInterval(waitMapa);
          // registra o listener de clique agora que mapa existe
          mapa.on("click", (e) => {
            if (!picking) return;
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            if (inputLat) inputLat.value = lat.toFixed(6);
            if (inputLng) inputLng.value = lng.toFixed(6);
            try {
              if (pickMarker) mapa.removeLayer(pickMarker);
              pickMarker = L.marker([lat, lng], { interactive: false }).addTo(mapa);
            } catch (err) {}
            picking = false;
            if (pickHint) pickHint.style.display = "none";
            try { mapa.getContainer().style.cursor = ""; } catch (e) {}
            abrirTela(telaAddOM);
          });
        } else if (attempts > 30) { // ~30 * 200ms = 6s
          clearInterval(waitMapa);
          console.warn("sizebar.js: timeout aguardando objeto `mapa` do map.js");
        }
      }, 200);
    }

    // ===========================
    //  Lógica dos filtros (segura)
    // ===========================
    const filtroOMs = document.getElementById("filtroOMs");
    const filtroEnlaces = document.getElementById("filtroEnlaces");
    const filtroCluster = document.getElementById("filtroCluster");

    if (filtroOMs) {
      filtroOMs.addEventListener("change", (e) => {
        try {
          if (e.target.checked) {
            if (typeof clusterGroup !== "undefined") {
              // repopula clusterGroup com markers existentes
              clusterGroup.clearLayers();
              if (typeof markers !== "undefined") {
                markers.forEach(m => clusterGroup.addLayer(m));
              }
              if (!mapa.hasLayer(clusterGroup)) mapa.addLayer(clusterGroup);
            }
          } else {
            if (typeof clusterGroup !== "undefined") {
              clusterGroup.clearLayers();
            }
          }
        } catch (err) {
          console.warn("Erro ao aplicar filtro OMs:", err);
        }
      });
    }

    if (filtroEnlaces) {
      filtroEnlaces.addEventListener("change", (e) => {
        try {
          if (e.target.checked) {
            if (typeof enlaceLayer !== "undefined" && !mapa.hasLayer(enlaceLayer)) mapa.addLayer(enlaceLayer);
          } else {
            if (typeof enlaceLayer !== "undefined" && mapa.hasLayer(enlaceLayer)) mapa.removeLayer(enlaceLayer);
          }
        } catch (err) {
          console.warn("Erro ao aplicar filtro Enlaces:", err);
        }
      });
    }

    // filtroCluster placeholder — se futuramente quiser trocar entre marker simples e cluster
    if (filtroCluster) {
      filtroCluster.addEventListener("change", () => {
        console.info("Filtro cluster alterado (placeholder).");
      });
    }

    // ===========================
    //  Submissões (placeholders)
    // ===========================
    const submitAddOM = document.getElementById("submitAddOM");
    if (submitAddOM) {
      submitAddOM.addEventListener("click", () => {
        // leitura básica (validações podem ser adicionadas)
        const h = document.getElementById("hostname")?.value || "";
        const n = document.getElementById("nome")?.value || "";
        const ip = document.getElementById("ip")?.value || "";
        const lat = document.getElementById("latitude")?.value || "";
        const lng = document.getElementById("longitude")?.value || "";

        if (!h || !n) {
          alert("Hostname e Nome são obrigatórios.");
          abrirTela(telaAddOM);
          return;
        }

        // Aqui você pode fazer fetch('/api/add-om', { method: 'POST', body: JSON.stringify(...) })
        console.log("submitAddOM:", { h, n, ip, lat, lng });

        // feedback mínimo
        alert("OM adicionada (simulação). Atualize a lista real pelo backend.");
      });
    }

    const submitAddEnlace = document.getElementById("submitAddEnlace");
    if (submitAddEnlace) {
      submitAddEnlace.addEventListener("click", () => {
        const a = document.getElementById("enlaceHostA")?.value || "";
        const b = document.getElementById("enlaceHostB")?.value || "";
        if (!a || !b) {
          alert("Hostname A e B são obrigatórios.");
          abrirTela(telaAddEnlace);
          return;
        }
        console.log("submitAddEnlace:", { a, b });
        alert("Enlace adicionado (simulação).");
      });
    }

    // Debug helper: mostra no console IDs encontrados (ajuda a confirmar que o script está atrelado)
    console.info("sizebar.js inicializado. Elementos:", {
      sidebar: !!sidebar,
      sidebarContent: !!sidebarContent,
      menuAddOM: !!menuAddOM,
      telaAddOM: !!telaAddOM,
      btnMapPick: !!btnMapPick,
      mapa: typeof mapa !== "undefined"
    });
  } // fim init
})();
