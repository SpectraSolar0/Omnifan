const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "help",
  description: "Affiche toutes les commandes disponibles",
  adminOnly: false,
  async execute(message, args, client) {
    const embed = new EmbedBuilder()
      .setTitle("📜 Commandes du bot")
      .setColor(0x3498DB)
      .setDescription(
        Array.from(client.commands)
          .map(
            ([name, cmdObj]) =>
              `**${name}** - ${cmdObj.command.description || "Pas de description"} ${
                cmdObj.enabled ? "" : "❌ Désactivée"
              }`
          )
          .join("\n")
      )
      .setFooter({ text: `Demandé par ${message.author.tag}` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
