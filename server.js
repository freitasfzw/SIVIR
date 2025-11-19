// server.js
const express = require("express");
const fetch = require("node-fetch");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const PUBLIC_DIR = path.join(__dirname, "public");

// serve arquivos estáticos (index.html está na raiz, css/js em pastas)
app.use("/assets", express.static(path.join(PUBLIC_DIR, "assets")));
app.use("/public", express.static(PUBLIC_DIR));
app.use(express.static(__dirname)); // serve index.html, css/, js/ se estiverem na raiz

// helper: lê locations.json
async function readLocations() {
  const p = path.join(PUBLIC_DIR, "locations.json");
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw);
}

// helper: consulta Nagios status JSON
// Ajuste NAGIOS_URL se seu Nagios usa outra URL
const NAGIOS_URL = process.env.NAGIOS_URL || "http://localhost/nagios/cgi-bin/statusjson.cgi?query=hostlist";
const NAGIOS_USER = process.env.NAGIOS_USER || null;
const NAGIOS_PASS = process.env.NAGIOS_PASS || null;

async function getNagiosJson() {
  const options = {};
  if (NAGIOS_USER && NAGIOS_PASS) {
    const token = Buffer.from(`${NAGIOS_USER}:${NAGIOS_PASS}`).toString("base64");
    options.headers = { Authorization: `Basic ${token}` };
  }
  const res = await fetch(NAGIOS_URL, options);
  if (!res.ok) {
    const text = await res.text().catch(()=>"");
    throw new Error(`Nagios fetch failed: ${res.status} ${text}`);
  }
  return await res.json();
}

// Endpoint que junta locations + Nagios
app.get("/api/om-status", async (req, res) => {
  try {
    const locations = await readLocations(); // array
    let nagios = null;
    try {
      nagios = await getNagiosJson();
    } catch (er) {
      // se não der pra pegar Nagios, vamos retornar UNKNOWN para os hosts
      console.warn("Não foi possível consultar Nagios:", er.message);
    }

    // Estrutura do Nagios pode variar — vamos buscar host list com algumas tentativas defensivas
    // Ex.: statusjson.cgi retorna { data: { hostlist: { hosts: { HOSTNAME: {...} }}}}
    const hostsObj = nagios?.data?.hostlist?.hosts || nagios?.data?.hosts || {};

    const merged = locations.map(loc => {
      // tentativa de match por hostname direto, ou por ip (address)
      const hostEntry = hostsObj[loc.hostname] || Object.values(hostsObj).find(h => h?.host_name === loc.hostname || h?.address === loc.ip);
      let status = "UNKNOWN";
      let last_check = null;
      if (hostEntry) {
        status = (hostEntry.status_text || hostEntry.state || hostEntry.status || "UNKNOWN").toUpperCase();
        last_check = hostEntry.last_check || hostEntry.last_check_time || null;
      }
      return {
        hostname: loc.hostname,
        nome: loc.nome,
        ip: loc.ip,
        status,
        last_check,
        latitude: loc.latitude,
        longitude: loc.longitude,
        foto: loc.foto
      };
    });

    res.json(merged);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`NagDash proxy + static server rodando em http://0.0.0.0:${PORT}`);
});
