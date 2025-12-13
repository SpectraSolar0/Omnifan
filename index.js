const { Client, GatewayIntentBits, Partials, ActivityType } = require("discord.js");
const fs = require("fs");
require("dotenv").config();

// ----------------------
// INITIALISATION DU CLIENT
// ----------------------
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

// ----------------------
// SERVEUR EXPRESS (KEEP ALIVE)
// ----------------------
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Bot actif !"));
app.listen(port, () =>
  console.log(`🌐 Serveur web actif sur le port ${port}`)
);

// ----------------------
// PREFIX & COMMANDES
// ----------------------
const prefix = "+";
client.commands = new Map();
const commandsFile = "./commands_state.json";

let commandStates = {};
if (fs.existsSync(commandsFile)) {
  commandStates = JSON.parse(fs.readFileSync(commandsFile, "utf8"));
}

if (!fs.existsSync("./commands")) fs.mkdirSync("./commands");
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  const enabled = commandStates[command.name] ?? true;

  client.commands.set(command.name, {
    command: { adminOnly: false, ...command },
    enabled,
  });
}

// ----------------------
// IDS AUTORISÉS
// ----------------------
const ALLOWED_IDS = ["1105601228047654912", "991295146215882872"];

// ----------------------
// LOGS CONFIG (CENTRALISÉ)
// ----------------------
const LOGS_CONFIG = {
  default: "1416538327682777088",

  members: "1449361022451187792",
  roles: "1449361022451187792",

  messages: "1449361307399753808",
  channels: "1449361307399753808",

  voice: "1449360380097855488",

  bans: "1449361373514563636",
};

// ----------------------
// CLIENT READY
// ----------------------
client.once("ready", async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: "🪬 Shield OFF 🪬", type: ActivityType.Watching }],
    status: "offline",
  });

  // Logger
  const setupLogger = require("./logger");
  setupLogger(client, LOGS_CONFIG);

  console.log("📡 Logger chargé avec LOGS_CONFIG.");
});

// ----------------------
// GESTION DES COMMANDES
// ----------------------
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const cmdObj = client.commands.get(commandName);
  if (!cmdObj) return;

  if (!cmdObj.enabled) {
    return message.reply("❌ Cette commande est désactivée.");
  }

  if (cmdObj.command.adminOnly && !ALLOWED_IDS.includes(message.author.id)) {
    return message.reply("❌ Tu n'as pas la permission.");
  }

  try {
    await cmdObj.command.execute(message, args, client);
  } catch (err) {
    console.error(err);
    message.reply("❌ Une erreur est survenue.");
  }
});

// ----------------------
// GESTION DES BOUTONS (PLAINTES)
// ----------------------
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isButton()) return;

  const guild = interaction.guild;
  const user = interaction.user;

  // Créer une plainte
  if (interaction.customId === "create_complaint") {
    try {
      const existing = guild.channels.cache.find(
        (c) => c.name === `plainte-${user.id}`
      );
      if (existing) {
        return interaction.reply({
          content: "❌ Tu as déjà une plainte ouverte.",
          ephemeral: true,
        });
      }

      const complaintChannel = await guild.channels.create({
        name: `plainte-${user.id}`,
        type: 0,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: ["ViewChannel"] },
          { id: user.id, allow: ["ViewChannel", "SendMessages"] },
        ],
      });

      await complaintChannel.send(
        `Bienvenue ${user}, ta plainte est créée.`
      );
      await interaction.reply({
        content: "✅ Plainte créée.",
        ephemeral: true,
      });
    } catch (err) {
      console.error(err);
      interaction.reply({
        content: "❌ Impossible de créer la plainte.",
        ephemeral: true,
      });
    }
  }

  // Fermer une plainte
  if (interaction.customId === "close_complaint") {
    try {
      await interaction.channel.delete();
    } catch (err) {
      console.error(err);
    }
  }
});

// ----------------------
// LOGIN
// ----------------------
client.login(process.env.TOKEN);

module.exports = client;

