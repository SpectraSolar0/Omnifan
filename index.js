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
// CLIENT PRÊT
// ----------------------
client.once("ready", () => {
  console.log(`✅ Connecté en tant que ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: "les révolutions 👀", type: ActivityType.Watching }],
    status: "online",
  });

  const setupLogger = require("./logger");
  setupLogger(client);
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
