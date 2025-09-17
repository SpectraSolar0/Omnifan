const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const fs = require("fs");
const path = require("path");

// Chemin vers le JSON
const foldersPath = path.join(__dirname, "..", "folders.json");
let dossiers = {};
if (fs.existsSync(foldersPath)) {
  dossiers = JSON.parse(fs.readFileSync(foldersPath, "utf8"));
}

module.exports = {
  name: "dossier",
  description: "Ouvre un panneau pour naviguer dans les dossiers des utilisateurs.",
  adminOnly: true,
  execute: async (message, args, client) => {
    let currentUser = null;
    let currentInfo = null;

    const generateEmbed = () => {
      const embed = new EmbedBuilder().setColor(0x3498DB);

      const row = new ActionRowBuilder();

      if (currentInfo) {
        // Affiche l'info choisie
        embed
          .setTitle(`${currentInfo} de ${currentUser}`)
          .setDescription(dossiers[currentUser][currentInfo]);

        row.addComponents(
          new ButtonBuilder()
            .setCustomId("back_info")
            .setLabel("⬅️ Retour")
            .setStyle(ButtonStyle.Secondary)
        );
      } else if (currentUser) {
        // Affiche les infos de l'utilisateur
        embed.setTitle(`Dossier de ${currentUser}`).setDescription("Clique sur une info ci-dessous :");

        Object.keys(dossiers[currentUser]).forEach(info => {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`info_${info}`)
              .setLabel(info)
              .setStyle(ButtonStyle.Primary)
          );
        });

        row.addComponents(
          new ButtonBuilder()
            .setCustomId("back_user")
            .setLabel("⬅️ Retour")
            .setStyle(ButtonStyle.Secondary)
        );
      } else {
        // Affiche tous les utilisateurs
        embed.setTitle("Sélectionne un utilisateur").setDescription("Clique sur un nom ci-dessous :");

        Object.keys(dossiers).forEach(user => {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`user_${user}`)
              .setLabel(user)
              .setStyle(ButtonStyle.Primary)
          );
        });
      }

      return { embed, row };
    };

    const { embed, row } = generateEmbed();
    const reply = await message.reply({ embeds: [embed], components: [row] });

    const collector = reply.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 60000
    });

    collector.on("collect", async (interaction) => {
      await interaction.deferUpdate();

      const id = interaction.customId;

      if (id.startsWith("user_")) {
        currentUser = id.replace("user_", "");
      } else if (id.startsWith("info_")) {
        currentInfo = id.replace("info_", "");
      } else if (id === "back_user") {
        currentUser = null;
      } else if (id === "back_info") {
        currentInfo = null;
      }

      const { embed: newEmbed, row: newRow } = generateEmbed();
      await reply.edit({ embeds: [newEmbed], components: [newRow] });
    });

    collector.on("end", async () => {
      const { embed: finalEmbed, row: finalRow } = generateEmbed();
      finalRow.components.forEach(btn => btn.setDisabled(true));
      await reply.edit({ embeds: [finalEmbed], components: [finalRow] });
    });
  }
};
