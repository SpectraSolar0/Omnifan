const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "plaintepanel",
  description: "Affiche le panneau des plaintes.",
  adminOnly: true,
  async execute(message) {
    // Embed pour le panneau des plaintes
    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("📢 Panneau de plaintes")
      .setDescription(
        "Vous rencontrez un problème avec un membre, un bug, ou autre chose qui mérite l’attention de l’équipe de modération ?\n\n" +
        "➡️ Cliquez sur le bouton ci-dessous pour **ouvrir une plainte**.\n" +
        "Un salon dédié sera créé automatiquement où vous pourrez expliquer votre problème en toute confidentialité.\n\n" +
        "⚠️ **À savoir :**\n" +
        "- Une seule plainte ouverte par personne à la fois.\n" +
        "- Les plaintes abusives ou non sérieuses pourront entraîner une sanction.\n" +
        "- Les modérateurs ainsi que les informaticiens feront de leurs mieux pour traiter votre demande rapidement.\n\n" +
        "Merci de votre coopération 🙏"
      )
      .setFooter({ text: "Système de plaintes automatique" });

    // Bouton pour créer une plainte
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("create_complaint")
        .setLabel("📩 Créer une plainte")
        .setStyle(ButtonStyle.Danger)
    );

    await message.channel.send({ embeds: [embed], components: [row] });
    if (message.deletable) message.delete().catch(() => {});
  }
};
