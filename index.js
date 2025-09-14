const { Client, GatewayIntentBits, Partials, ActivityType, PermissionsBitField } = require("discord.js");
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

const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Bot actif !");
});

app.listen(port, () => {
  console.log(`🌐 Serveur web actif sur le port ${port}`);
});

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
const commandFiles = fs.readdirSync("./commands").filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  const enabled = commandStates[command.name] ?? true;
  client.commands.set(command.name, { command, enabled });
}

// ----------------------
// IDs AUTORISÉS
// ----------------------
const ALLOWED_IDS = ["1105601228047654912", "991295146215882872"];

// ----------------------
// SALON DE LOGS
// ----------------------
const LOG_CHANNEL_ID = "1416538327682777088"; // Remplace par ton ID

// ----------------------
// CLIENT PRÊT
// ----------------------
client.once("ready", async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: "les révolutions 👀", type: ActivityType.Watching }],
    status: "online",
  });

  const setupLogger = require("./logger");
  setupLogger(client);

  // Sécuriser le salon de logs au niveau des permissions
  const guild = client.guilds.cache.first();
  const logChannel = await guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
  if (logChannel) {
    logChannel.permissionOverwrites.set([
      {
        id: guild.roles.everyone.id,
        deny: [PermissionsBitField.Flags.ManageMessages],
      },
      {
        id: client.user.id,
        allow: [PermissionsBitField.Flags.ManageMessages],
      },
    ]);
  }
});

// ----------------------
// PROTECTION DES MESSAGES DU BOT DANS LES LOGS
// ----------------------
client.on("messageDelete", async (message) => {
  try {
    if (!message.guild) return;
    if (message.channel.id !== LOG_CHANNEL_ID) return;

    const logChannel = await message.guild.channels.fetch(LOG_CHANNEL_ID);
    if (!logChannel) return;

    // Restaurer les messages du bot immédiatement
    if (message.author.id === client.user.id) {
      let content = message.content || "[Message sans contenu]";
      let attachments = message.attachments.map((a) => a.url).join("\n");
      let restoreMessage = `🔄 Message du bot restauré:\n${content}`;
      if (attachments) restoreMessage += `\n**Pièces jointes:**\n${attachments}`;
      await logChannel.send(restoreMessage);
    } else {
      // Logger les messages supprimés par un utilisateur
      let content = message.content || "[Message sans contenu]";
      let author = message.author ? message.author.tag : "Inconnu";
      let attachments = message.attachments.map((a) => a.url).join("\n");
      let logMessage = `🛑 Message supprimé par un utilisateur!\n**Auteur:** ${author}\n**Contenu:** ${content}`;
      if (attachments) logMessage += `\n**Pièces jointes:**\n${attachments}`;
      await logChannel.send(logMessage);
    }
  } catch (err) {
    console.error("Erreur lors de la gestion de message supprimé:", err);
  }
});

// ----------------------
// GESTION DES COMMANDES
// ----------------------
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;

  if (!ALLOWED_IDS.includes(message.author.id)) {
    return message.reply("❌ Vous n'êtes pas autorisé à utiliser les commandes de ce bot !");
  }

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const cmdObj = client.commands.get(commandName);
  if (!cmdObj) return;

  if (!cmdObj.enabled) return message.reply("❌ Cette commande est désactivée !");

  try {
    await cmdObj.command.execute(message, args, client);
  } catch (err) {
    console.error(err);
    message.reply("❌ Une erreur est survenue.");
  }
});

// ----------------------
// LOGIN
// ----------------------
client.login(process.env.TOKEN);

module.exports = client;
