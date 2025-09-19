const fs = require("fs");
const path = require("path");
const { EmbedBuilder } = require("discord.js");
const warnsFile = path.join(__dirname, "../warns.json");

module.exports = {
  name: "warns",
  description: "Affiche tous les warns d'un utilisateur. - admin only",
  adminOnly: true,
  async execute(message, args) {
    const userId = args[0];
    if (!userId) return message.reply("❌ Usage: +warns [id]");

    if (!fs.existsSync(warnsFile)) return message.reply("Aucun warn enregistré.");

    const warns = JSON.parse(fs.readFileSync(warnsFile, "utf8"));
    const userWarns = warns[userId];

    if (!userWarns || userWarns.length === 0) return message.reply("Cet utilisateur n'a aucun warn.");

    const embed = new EmbedBuilder()
      .setTitle(`⚠️ Warns de <@${userId}>`)
      .setColor(0xE67E22);

    userWarns.forEach((w, i) => {
      embed.addFields({ name: `#${i + 1} - ${w.date}`, value: `Raison: ${w.reason}\nModérateur: ${w.moderator}` });
    });

    message.reply({ embeds: [embed] });
  }
};
