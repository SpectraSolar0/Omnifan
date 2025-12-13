const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  name: "renamebot",
  description: "Renommer le bot sur le serveur avec confirmation",
  adminOnly: false,
  moderatorOnly: false,
  ownerOnly: true,

  async execute(message, args) {

    /* ================= VÉRIFICATIONS ================= */

    // Permission admin
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ Permission refusée.");
    }

    const newName = args.join(" ");
    if (!newName) {
      return message.reply("❌ Merci de préciser le nouveau nom du bot.");
    }

    if (newName.length > 32) {
      return message.reply("❌ Le nom ne peut pas dépasser 32 caractères.");
    }

    const botMember = message.guild.members.me;

    /* ================= CONFIRMATION ================= */

    const confirmEmbed = new EmbedBuilder()
      .setTitle("⚠️ CONFIRMATION REQUISE")
      .setColor(0xffaa00)
      .setDescription(
        `Tu es sur le point de renommer le bot sur ce serveur.\n\n` +
        `🤖 **Nom actuel :** ${botMember.nickname || botMember.user.username}\n` +
        `📝 **Nouveau nom :** ${newName}\n\n` +
        `Souhaites-tu continuer ?`
      )
      .setFooter({ text: "Action irréversible sans nouvelle commande" })
      .setTimestamp();

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("rename_confirm")
        .setLabel("✅ CONFIRMER")
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId("rename_cancel")
        .setLabel("❌ ANNULER")
        .setStyle(ButtonStyle.Danger)
    );

    const confirmMessage = await message.channel.send({
      embeds: [confirmEmbed],
      components: [buttons]
    });

    /* ================= INTERACTIONS ================= */

    const collector = confirmMessage.createMessageComponentCollector({
      time: 30_000
    });

    collector.on("collect", async interaction => {

      // Seul l’auteur peut confirmer
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: "❌ Tu n’es pas autorisé à utiliser ces boutons.",
          ephemeral: true
        });
      }

      await interaction.deferUpdate();

      /* ===== CONFIRMÉ ===== */
      if (interaction.customId === "rename_confirm") {
        try {
          await botMember.setNickname(newName);

          const successEmbed = new EmbedBuilder()
            .setTitle("🤖 BOT RENOMMÉ")
            .setColor(0x00ff99)
            .setDescription(
              `✅ Le bot a été renommé avec succès.\n\n` +
              `📝 **Nouveau nom :** ${newName}\n\n` +
              `📌 Ce changement est **local au serveur**.`
            )
            .setTimestamp();

          await confirmMessage.edit({
            embeds: [successEmbed],
            components: []
          });

        } catch (err) {
          console.error(err);
          await confirmMessage.edit({
            content: "❌ Impossible de renommer le bot. Vérifie mes permissions.",
            embeds: [],
            components: []
          });
        }
      }

      /* ===== ANNULÉ ===== */
      if (interaction.customId === "rename_cancel") {
        const cancelEmbed = new EmbedBuilder()
          .setTitle("❌ ACTION ANNULÉE")
          .setColor(0xff3333)
          .setDescription("Le renommage du bot a été annulé.")
          .setTimestamp();

        await confirmMessage.edit({
          embeds: [cancelEmbed],
          components: []
        });
      }

      collector.stop();
    });

    collector.on("end", (_, reason) => {
      if (reason === "time") {
        confirmMessage.edit({
          content: "⏱️ Temps écoulé. Action annulée.",
          embeds: [],
          components: []
        }).catch(() => {});
      }
    });
  }
};
