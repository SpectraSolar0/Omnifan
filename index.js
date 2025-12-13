const {
  Client,
  GatewayIntentBits,
  Partials,
  ActivityType,
  PermissionsBitField
} = require("discord.js");
const fs = require("fs");
const express = require("express");
const path = require("path");
require("dotenv").config();

/* ======================
   DISCORD CLIENT
====================== */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

/* ======================
   EXPRESS
====================== */
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_, res) => res.send("Bot actif !"));

/* ======================
   PERMISSIONS (FICHIER)
====================== */
const permissionsFile = path.join(__dirname, "permissions.json");

function loadPermissions() {
  if (!fs.existsSync(permissionsFile)) {
    const base = { owners: [], admins: [], moderators: [] };
    fs.writeFileSync(permissionsFile, JSON.stringify(base, null, 2));
    return base;
  }

  try {
    return JSON.parse(fs.readFileSync(permissionsFile, "utf8"));
  } catch (e) {
    console.error("❌ permissions.json invalide");
    return { owners: [], admins: [], moderators: [] };
  }
}

/* ======================
   PANEL WEB
====================== */
app.get("/panel", (req, res) => {
  const perms = loadPermissions();

  res.send(`
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Panel du bot</title>
<style>
body { background:#0f172a;color:white;font-family:Arial;padding:30px }
textarea { width:100%;height:70px }
button { padding:12px 20px;margin-top:15px;font-size:16px }
h1,h2 { margin-bottom:10px }
</style>
</head>
<body>

<h1>🤖 Panel de configuration du bot</h1>

<form method="POST" action="/panel/save">
  <h2>👑 Owners (IDs utilisateurs)</h2>
  <textarea name="owners">${perms.owners.join(",")}</textarea>

  <h2>🛡️ Admins (IDs rôles)</h2>
  <textarea name="admins">${perms.admins.join(",")}</textarea>

  <h2>👮 Modérateurs (IDs rôles)</h2>
  <textarea name="moderators">${perms.moderators.join(",")}</textarea>

  <button>💾 Sauvegarder</button>
</form>

<p>✅ Appliqué instantanément</p>

</body>
</html>
`);
});

app.post("/panel/save", (req, res) => {
  const clean = txt =>
    txt.split(",").map(x => x.trim()).filter(Boolean);

  const data = {
    owners: clean(req.body.owners || ""),
    admins: clean(req.body.admins || ""),
    moderators: clean(req.body.moderators || "")
  };

  fs.writeFileSync(permissionsFile, JSON.stringify(data, null, 2));
  console.log("📝 permissions.json mis à jour :", data);

  res.redirect("/panel");
});

app.listen(port, () =>
  console.log(`🌐 Serveur web actif sur le port ${port}`)
);

/* ======================
   COMMANDES
====================== */
const prefix = "+";
client.commands = new Map();

if (!fs.existsSync("./commands")) fs.mkdirSync("./commands");

for (const file of fs.readdirSync("./commands").filter(f => f.endsWith(".js"))) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  if (!message.guild) return; // ❗ empêche les crash DM

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command = client.commands.get(commandName);
  if (!command) return;

  const perms = loadPermissions();

  const isOwner = perms.owners.includes(message.author.id);
  const isAdmin = message.member.roles.cache.some(r => perms.admins.includes(r.id));
  const isModerator = message.member.roles.cache.some(r => perms.moderators.includes(r.id));

  if (command.ownerOnly && !isOwner)
    return message.reply("❌ Commande réservée au owner.");

  if (command.adminOnly && !isAdmin && !isOwner)
    return message.reply("❌ Commande réservée aux admins.");

  if (command.moderatorOnly && !isModerator && !isAdmin && !isOwner)
    return message.reply("❌ Commande réservée à la modération.");

  try {
    await command.execute(message, args, client);
  } catch (err) {
    console.error(err);
    message.reply("❌ Une erreur est survenue.");
  }
});

/* ======================
   READY
====================== */
client.once("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: "🪬 Shield OFF 🪬", type: ActivityType.Watching }],
    status: "online",
  });
});

/* ======================
   LOGIN
====================== */
client.login(process.env.TOKEN);
