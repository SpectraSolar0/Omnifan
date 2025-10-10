// jsonbin.js
const fetch = require("node-fetch");

const binId = "68e91568d0ea881f409c8b6c"; // remplace par ton bin ID
const token = "$2a$10$11p39dS9g7M04NUjuQqj5OpJhzLCnfQoxswxG9KIrE6QO/Ofzdp1K"; // mets ton token dans .env

// Lire les casiers depuis JSONBin
async function getCasiers() {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}/latest`, {
    headers: { "X-Master-Key": token }
  });
  const data = await res.json();
  return data.record;
}

// Mettre à jour les casiers sur JSONBin
async function updateCasiers(casiersData) {
  const res = await fetch(`https://api.jsonbin.io/v3/b/${binId}`, {
    method: "PUT",
    headers: {
      "X-Master-Key": token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(casiersData)
  });
  const data = await res.json();
  return data;
}

module.exports = { getCasiers, updateCasiers };
