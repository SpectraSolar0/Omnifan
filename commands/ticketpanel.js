const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require("discord.js");

module.exports = {
  name: "ticketpanel",
  description: "Crée le panneau pour ouvrir une plainte",
  adminOnly: true, // Seuls les admins peuvent créer le panel

  async execute(message) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open-ticket")
        .setLabel("🎫 Ouvrir une plainte")
        .setStyle(ButtonStyle.Primary)
    );

    await message.channel.send({
      content: "📩 Cliquez sur le bouton ci-dessous pour ouvrir une plainte :",
      components: [row],
    });
  },
};
