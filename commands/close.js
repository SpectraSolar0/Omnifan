const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: "close",
  description: "Envoie un bouton pour fermer la plainte. - admin only",
  adminOnly: true,
  moderatorOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has("ManageChannels")) {
      return message.reply("❌ Tu n'as pas la permission de fermer ce salon !");
    }

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('close_complaint')
          .setLabel('Fermer la plainte')
          .setStyle(ButtonStyle.Secondary)
      );

    try {
      await message.channel.send({ content: "Clique sur le bouton pour fermer la plainte.", components: [row] });
    } catch (err) {
      console.error(err);
      message.channel.send("❌ Impossible d'envoyer le bouton de fermeture.");
    }
  }
};
