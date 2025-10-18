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

// ----------------------
// SERVEUR EXPRESS POUR KEEP-ALIVE
// ----------------------
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.get("/", (req, res) => res.send("Bot actif !"));
app.listen(port, () => console.log(`🌐 Serveur web actif sur le port ${port}`));

// ----------------------
// PREFIX & COMMANDES
// ----------------------
const prefix = "+";
client.commands = new Map();
const commandsFile = "./commands_state.json";

let commandStates = {};
if (fs.existsSync(commandsFile)) commandStates = JSON.parse(fs.readFileSync(commandsFile, "utf8"));

if (!fs.existsSync("./commands")) fs.mkdirSync("./commands");
const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  const enabled = commandStates[command.name] ?? true;
  client.commands.set(command.name, { command: { adminOnly: false, ...command }, enabled });
}

// ----------------------
// IDs AUTORISÉS
// ----------------------
const ALLOWED_IDS = ["1105601228047654912", "991295146215882872", "1216312581732438026"];

// ----------------------
// SALON DE LOGS
// ----------------------
const LOG_CHANNEL_ID = "1416538327682777088";

// ----------------------
// CLIENT PRÊT
// ----------------------
client.once("ready", async () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: "les révolutions 👀", type: ActivityType.Watching }],
    status: "offline",
  });

  const setupLogger = require("./logger");
  setupLogger(client);

  // Sécuriser le salon de logs au niveau des permissions
  const guild = client.guilds.cache.first();
  const logChannel = await guild.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
  if (logChannel) {
    logChannel.permissionOverwrites.set([
      { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ManageMessages] },
      { id: client.user.id, allow: [PermissionsBitField.Flags.ManageMessages] },
    ]);
  }
});

// ----------------------
// PROTECTION DES MESSAGES DU BOT DANS LES LOGS
// ----------------------
client.on("messageDelete", async (message) => {
  try {
    if (!message.guild || message.channel.id !== LOG_CHANNEL_ID) return;

    const logChannel = await message.guild.channels.fetch(LOG_CHANNEL_ID);
    if (!logChannel) return;

    if (message.author.id === client.user.id) {
      let content = message.content || "[Message sans contenu]";
      let attachments = message.attachments.map(a => a.url).join("\n");
      let restoreMessage = `🔄 Message du bot restauré:\n${content}`;
      if (attachments) restoreMessage += `\n**Pièces jointes:**\n${attachments}`;
      await logChannel.send(restoreMessage);
    } else {
      let content = message.content || "[Message sans contenu]";
      let author = message.author ? message.author.tag : "Inconnu";
      let attachments = message.attachments.map(a => a.url).join("\n");
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
  if (message.author.bot || !message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  const cmdObj = client.commands.get(commandName);
  if (!cmdObj) return;
  if (!cmdObj.enabled) return message.reply("❌ Cette commande est désactivée !");

  if (cmdObj.command.adminOnly && !ALLOWED_IDS.includes(message.author.id)) {
    return message.reply("❌ Vous n'avez pas la permission d'utiliser cette commande !");
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
      const existing = guild.channels.cache.find(c => c.name === `plainte-${user.id}`);
      if (existing)
        return interaction.reply({ content: "❌ Tu as déjà une plainte ouverte !", ephemeral: true });

      const complaintChannel = await guild.channels.create({
        name: `plainte-${user.id}`,
        type: 0, // texte
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: ["ViewChannel"] },
          { id: user.id, allow: ["ViewChannel", "SendMessages"] },
        ],
      });

      await complaintChannel.send(`Bienvenue ${user}, ta plainte est créée !`);
      await interaction.reply({ content: "✅ Ta plainte a été créée.", ephemeral: true });
    } catch (err) {
      console.error(err);
      interaction.reply({ content: "❌ Impossible de créer la plainte.", ephemeral: true });
    }
  }

  // Fermer une plainte
  if (interaction.customId === "close_complaint") {
    try {
      await interaction.channel.delete();
    } catch (err) {
      console.error(err);
      interaction.reply({ content: "❌ Impossible de fermer la plainte.", ephemeral: true });
    }
  }
});

// ----------------------
// LOGIN
// ----------------------
client.login(process.env.TOKEN);

module.exports = client;
