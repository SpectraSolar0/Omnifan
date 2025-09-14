const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require("discord.js");

module.exports = {
  name: "shutdown",
  description: "Éteint le bot (commande réservée au propriétaire).",
  execute: async (client, message, args) => {
    const ownerId = "991295146215882872"; // 🔴 remplace par ton ID

    if (message.author.id !== ownerId) {
      return message.reply("⛔ Tu n'as pas la permission d'éteindre le bot !");
    }

    // Crée l'embed d'avertissement
    const embed = new EmbedBuilder()
      .setTitle("⚠️ Extinction du bot")
      .setDescription("Tu es sur le point de **couper l'accès aux commandes**.\n\nVeux-tu vraiment continuer ?")
      .setColor(0xE74C3C);

    // Crée les boutons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("shutdown_confirm")
        .setLabel("✅ Confirmer")
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId("shutdown_cancel")
        .setLabel("❌ Annuler")
        .setStyle(ButtonStyle.Secondary)
    );

    const reply = await message.reply({ embeds: [embed], components: [row] });

    // Création d’un collector pour écouter les clics
    const collector = reply.createMessageComponentCollector({
      filter: (interaction) => interaction.user.id === ownerId,
      time: 15000, // 15s pour choisir
    });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === "shutdown_cancel") {
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("❌ Extinction annulée")
              .setColor(0x2ECC71),
          ],
          components: [],
        });
        collector.stop();
      }

      if (interaction.customId === "shutdown_confirm") {
        await interaction.update({
          embeds: [
            new EmbedBuilder()
              .setTitle("👋 Extinction en cours...")
              .setColor(0xE74C3C),
          ],
          components: [],
        });

        console.log(`🛑 Bot éteint par ${interaction.user.tag}`);
        collector.stop();

        client.destroy();
        process.exit(0);
      }
    });

    collector.on("end", async (collected) => {
      if (collected.size === 0) {
        await reply.edit({
          embeds: [
            new EmbedBuilder()
              .setTitle("⌛ Temps écoulé")
              .setDescription("L’extinction a été annulée automatiquement.")
              .setColor(0x95A5A6),
          ],
          components: [],
        });
      }
    });
  },
};
