const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "help",
  description: "Affiche toutes les commandes disponibles",
  adminOnly: false,

  async execute(message, args, client) {
    const embed = new EmbedBuilder()
      .setTitle("📜 Commandes du bot")
      .setColor(0x3498db)
      .setDescription(
        Array.from(client.commands.values())
          .map(
            (cmd) =>
              `**+${cmd.name}** — ${cmd.description || "Aucune description"}`
          )
          .join("\n")
      )
      .setFooter({ text: `Demandé par ${message.author.tag}` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
