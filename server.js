// server.js
const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, "public");

// serve arquivos estáticos
app.use("/assets", express.static(path.join(PUBLIC_DIR, "assets")));
app.use("/public", express.static(PUBLIC_DIR));
app.use(express.static(__dirname));

// ====== Lê locations.json ======
async function readLocations() {
  const p = path.join(PUBLIC_DIR, "locations.json");
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw);
}

// ====== Config Nagios ======
const NAGIOS_HOST = "10.26.1.161";
const NAGIOS_USER = "nagiosadmin";
const NAGIOS_PASS = "123456";

function nagiosAuth() {
  const token = Buffer.from(`${NAGIOS_USER}:${NAGIOS_PASS}`).toString("base64");
  return { "Authorization": `Basic ${token}` };
}

// ============================================================
//  HOSTGROUPS — todas as cidades/regiões que deseja consultar
// ============================================================

const HOSTGROUPS = [
  "santa_maria",
  "itaara",
  "alegrete",
  "santiago",
  "sao_borja",
  "sao_gabriel",
  "uruguaiana",
  "cruz_alta",
  "cachoeira_do_sul",
  "itaqui",
  "rosario_do_sul"
];

// ============================================================
//  Busca lista de hostnames em TODOS os hostgroups acima
// ============================================================

async function getHostList() {
  const result = new Set();

  for (const g of HOSTGROUPS) {
    const url = `http://${NAGIOS_HOST}/nagios/cgi-bin/statusjson.cgi?query=hostlist&hostgroup=${g}`;

    try {
      const res = await fetch(url, { headers: nagiosAuth() });
      if (!res.ok) continue;

      const json = await res.json();
      const hosts = Object.keys(json.data.hostlist || {});

      hosts.forEach(h => result.add(h));

      console.log(`Hostgroup ${g}:`, hosts.length, "hosts carregados");

    } catch (err) {
      console.warn(`Falha ao ler hostgroup ${g}:`, err.message);
    }
  }

  console.log("Total hosts combinados:", result.size);
  return [...result];
}

// ============================================================
//  Puxa detalhes de um host
// ============================================================

async function getHostDetails(hostname) {
  const url = `http://${NAGIOS_HOST}/nagios/cgi-bin/statusjson.cgi?query=host&hostname=${hostname}`;

  const res = await fetch(url, { headers: nagiosAuth() });
  if (!res.ok) return null;

  const json = await res.json();
  return json.data.host || null;
}

// ============================================================
//  Endpoint principal
// ============================================================

app.get("/api/om-status", async (req, res) => {
  try {
    const locations = await readLocations();
    const hostnames = await getHostList();

    // Pega detalhes
    const details = {};
    for (const h of hostnames) {
      details[h] = await getHostDetails(h);
    }

    const merged = locations.map(loc => {
      const detail = details[loc.hostname];

      if (!detail) {
        return {
          ...loc,
          status: "UNKNOWN",
          last_check: null
        };
      }

      const code = detail.last_hard_state ?? detail.status;

      const STATUS_MAP = {
        0: "UP",
        1: "DOWN",
        2: "UNREACHABLE",
        3: "UNKNOWN"
      };

      const statusText = STATUS_MAP[code] || "UNKNOWN";

      const lastCheck = detail.last_check
        ? new Date(detail.last_check).toLocaleString("pt-BR")
        : null;

      return {
        ...loc,
        status: statusText,
        last_check: lastCheck
      };
    });

    res.json(merged);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`NagDash rodando em http://0.0.0.0:${PORT}`);
});