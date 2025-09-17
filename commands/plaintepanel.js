const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  name: "plaintepanel",
  description: "Envoie un panneau pour créer une plainte.",
  adminOnly: true,
  async execute(message, args) {
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('create_complaint')
          .setLabel('Déposer une plainte')
          .setStyle(ButtonStyle.Danger)
      );

    try {
      await message.channel.send({
        content: 'Clique sur le bouton pour déposer une plainte !',
        components: [row]
      });
      message.reply("✅ Panneau de plainte envoyé.").then(msg => {
        setTimeout(() => msg.delete().catch(() => {}), 5000);
      });
    } catch (err) {
      console.error(err);
      message.channel.send("❌ Impossible d'envoyer le panneau de plainte.");
    }
  }
};
