const fs = require("fs");
const path = require("path");

const configPath = path.join(__dirname, "../logs_config.json");

module.exports = {
  name: "setlogs",
  description: "Définit le salon des logs.",
  adminOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ Tu dois être administrateur pour utiliser cette commande.");
    }

    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply("❌ Merci de mentionner un salon valide : `!setlogs #salon`");
    }

    // Sauvegarder l'ID du salon dans un fichier
    const config = { logChannel: channel.id };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    message.reply(`✅ Salon des logs défini sur : ${channel}`);
  }
};
