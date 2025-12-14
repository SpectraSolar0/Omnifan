const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  name: "ticket",
  description: "Poster le panel de tickets",
  AdminOnly: true,

  async execute(message) {
    const embed = new EmbedBuilder()
      .setTitle("🎫 SYSTÈME DE TICKETS — SUPPORT OFFICIEL")
      .setColor(0x5865f2)
      .setDescription(
        "**Bienvenue sur le support du serveur** 👋\n\n" +

        "Ce système te permet de **contacter le staff en privé** afin de traiter ta demande " +
        "de manière **confidentielle, claire et organisée**.\n\n" +

        "### 📌 Avant d’ouvrir un ticket\n" +
        "• Vérifie que ta demande n’a pas déjà été traitée\n" +
        "• Sois **clair, précis et respectueux**\n" +
        "• Un seul ticket par personne est autorisé\n\n" +

        "### 📂 Choisis le type de ticket correspondant à ta demande :\n" +
        "⚖️ **Plainte contre un joueur** : signalement ou comportement\n" +
        "📢 **Demande média** : publication officielle\n" +
        "❓ **Autre demande** : toute autre question\n\n" +

        "_Un membre du staff te répondra dès que possible._"
      )
      .setFooter({
        text: "Support du serveur • Merci de votre patience"
      });

    const menu = new StringSelectMenuBuilder()
      .setCustomId("ticket_type")
      .setPlaceholder("📂 Sélectionne le type de ticket à ouvrir")
      .addOptions(
        {
          label: "Plainte contre un joueur",
          value: "plainte",
          description: "Signaler un joueur ou un comportement",
          emoji: "⚖️"
        },
        {
          label: "Demande média",
          value: "media",
          description: "Demander une publication officielle dans le salon média",
          emoji: "📢"
        },
        {
          label: "Autre demande",
          value: "autre",
          description: "Question ou demande diverse",
          emoji: "❓"
        }
      );

    await message.channel.send({
      embeds: [embed],
      components: [new ActionRowBuilder().addComponents(menu)]
    });

    await message.reply("✅ Panel de ticket posté.");
  }
};
