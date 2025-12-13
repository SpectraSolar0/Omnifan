const {
  Client,
  GatewayIntentBits,
  Partials,
  ActivityType,
  PermissionsBitField
} = require("discord.js");
const fs = require("fs");
const express = require("express");
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
   PERMISSIONS DYNAMIQUES
====================== */
const permissionsFile = "./permissions.json";

function loadPermissions() {
  if (!fs.existsSync(permissionsFile)) {
    return { owners: [], admins: [], moderators: [] };
  }
  return JSON.parse(fs.readFileSync(permissionsFile, "utf8"));
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

<p>Les changements sont appliqués immédiatement.</p>

</body>
</html>
`);
});

app.post("/panel/save", (req, res) => {
  const clean = (txt) =>
    txt.split(",").map(x => x.trim()).filter(Boolean);

  const data = {
    owners: clean(req.body.owners || ""),
    admins: clean(req.body.admins || ""),
    moderators: clean(req.body.moderators || "")
  };

  fs.writeFileSync(permissionsFile, JSON.stringify(data, null, 2));
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

const commandFiles = fs.readdirSync("./commands").filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

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
   PLAINTES (BOUTONS)
====================== */
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const { guild, user } = interaction;

  if (interaction.customId === "create_complaint") {
    try {
      const existing = guild.channels.cache.find(
        c => c.name === `plainte-${user.id}`
      );
      if (existing) {
        return interaction.reply({
          content: "❌ Tu as déjà une plainte ouverte.",
          ephemeral: true,
        });
      }

      const channel = await guild.channels.create({
        name: `plainte-${user.id}`,
        type: 0,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: ["ViewChannel"] },
          { id: user.id, allow: ["ViewChannel", "SendMessages"] },
        ],
      });

      await channel.send(`👋 Bonjour ${user}, ta plainte est créée.`);
      interaction.reply({ content: "✅ Plainte créée.", ephemeral: true });
    } catch (err) {
      console.error(err);
      interaction.reply({
        content: "❌ Impossible de créer la plainte.",
        ephemeral: true,
      });
    }
  }

  if (interaction.customId === "close_complaint") {
    try {
      await interaction.channel.delete();
    } catch (err) {
      console.error(err);
    }
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

  if (fs.existsSync("./logger.js")) {
    require("./logger")(client);
    console.log("📡 Logger chargé.");
  }
});

/* ======================
   LOGIN
====================== */
client.login(process.env.TOKEN);

module.exports = client;
