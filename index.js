const {
  Client,
  GatewayIntentBits,
  Partials,
  ActivityType,
} = require("discord.js");
const fs = require("fs");
const express = require("express");
require("dotenv").config();

/* ======================
   CLIENT
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
   EXPRESS (KEEP ALIVE)
====================== */
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (_, res) => res.send("Bot actif !"));
app.listen(port, () =>
  console.log(`🌐 Serveur web actif sur le port ${port}`)
);

/* ======================
   PREFIX & COMMANDES
====================== */
const prefix = "+";
client.commands = new Map();

if (!fs.existsSync("./commands")) fs.mkdirSync("./commands");

const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.name, command);
}

/* ======================
   AUTORISATIONS
====================== */

// Owners (IDs utilisateurs)
const OWNERS = ["991295146215882872"];

// Rôles serveur
const ADMIN_ROLES = ["1105601228047654912"];
const MODERATOR_ROLES = [
  "1331951922848075776",
  "1158083115781210112",
  "1288079091211309179",
  "1069257082219540613",
  "775095022126235661",
];

/* ======================
   LOGS CONFIG
====================== */
const LOGS_CONFIG = {
  default: "1416538327682777088",

  members: "1449361022451187792",
  roles: "1449361022451187792",

  messages: "1449361307399753808",
  channels: "1449361307399753808",

  voice: "1449360380097855488",
  bans: "1449361373514563636",
};

/* ======================
   READY
====================== */
client.once("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: "🪬 Shield OFF 🪬", type: ActivityType.Watching }],
    status: "online",
  });

  require("./logger")(client, LOGS_CONFIG);
  console.log("📡 Logger multi-salons chargé.");
});

/* ======================
   COMMANDES
====================== */
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const command = client.commands.get(commandName);
  if (!command) return;

  // Permissions
  const isOwner = OWNERS.includes(message.author.id);
  const isAdmin = message.member.roles.cache.some((r) =>
    ADMIN_ROLES.includes(r.id)
  );
  const isModerator = message.member.roles.cache.some((r) =>
    MODERATOR_ROLES.includes(r.id)
  );

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
   INTERACTIONS (BOUTONS / MENUS)
====================== */
client.on("interactionCreate", async (interaction) => {
  try {
    require("./interactionCreate")(interaction, client);
  } catch (err) {
    console.error("❌ Erreur interactionCreate :", err);

    if (interaction.isRepliable()) {
      interaction.reply({
        content: "❌ Une erreur est survenue.",
        ephemeral: true,
      }).catch(() => {});
    }
  }
});

/* ======================
   LOGIN
====================== */
client.login(process.env.TOKEN);

module.exports = client;
