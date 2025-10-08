const fs = require("fs");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  name: "casier",
  description: "Affiche les casiers judiciaires des membres.",
  async execute(message, args, client) {
    const dataPath = "./casiers.json";
    if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, "{}");
    const casiersData = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    const membres = [
      "Mr Diego",
      "Mr Léo F.",
      "Mr Fromage",
      "Mlle Léo L.",
      "Mr Afraaz",
      "Mr Joachim",
      "Mr Miniburger",
      "Mr Gabriel",
      "Mr Adam",
      "Mr Estaban",
      "Mr Martin",
      "Mr Antoine",
      "Mlle Maryne",
      "Mr Alhumam",
      "Mr Cyprien",
      "Mr Justin",
      "Mr Noa",
      "Mr Aldo",
    ];

    // Menu principal
    const rows = [];
    const boutonsParLigne = 5;
    for (let i = 0; i < membres.length; i += boutonsParLigne) {
      const row = new ActionRowBuilder();
      const chunk = membres.slice(i, i + boutonsParLigne);
      chunk.forEach((nom) => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`personne_${nom}`)
            .setLabel(nom)
            .setStyle(ButtonStyle.Primary)
        );
      });
      rows.push(row);
    }

    const embedMenu = new EmbedBuilder()
      .setTitle("📁 Menu des casiers judiciaires")
      .setDescription(
        "Choisis une personne pour consulter ses casiers :"
      )
      .setColor(0x5865f2);

    let menuMessage;
    try {
      menuMessage = await message.channel.send({
        embeds: [embedMenu],
        components: rows,
      });
    } catch (err) {
      console.error("Erreur en envoyant le menu :", err);
      return;
    }

    const collector = menuMessage.createMessageComponentCollector({
      time: 300000,
    });

    collector.on("collect", async (interaction) => {
      if (!interaction.isButton()) return;
      const id = interaction.customId;

      // Bouton retour
      if (id === "retour") {
        try {
          await interaction.update({ embeds: [embedMenu], components: rows });
        } catch {}
        return;
      }

      // Sélection d'une personne
      if (id.startsWith("personne_")) {
        const nom = id.replace("personne_", "");
        const casiers = casiersData[nom] || [];

        const casierRows = [];
        if (casiers.length > 0) {
          const row = new ActionRowBuilder();
          casiers.forEach((c) => {
            row.addComponents(
              new ButtonBuilder()
                .setCustomId(`casier_${nom}_${c.id}`)
                .setLabel(`Casier ${c.id}`)
                .setStyle(ButtonStyle.Secondary)
            );
          });
          casierRows.push(row);
        }

        // Bouton retour
        const retourRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("retour")
            .setLabel("↩️ Retour")
            .setStyle(ButtonStyle.Secondary)
        );

        const embedPerso = new EmbedBuilder()
          .setTitle(`📂 Casiers de ${nom}`)
          .setColor(0xf1c40f)
          .setDescription(
            casiers.length > 0
              ? "Clique sur un casier pour voir ses détails."
              : "❌ Aucun casier pour cette personne."
          );

        try {
          await interaction.update({
            embeds: [embedPerso],
            components: [...casierRows, retourRow],
          });
        } catch {}
      }

      // Affichage d’un casier
      if (id.startsWith("casier_")) {
        const [, nom, casierId] = id.split("_");
        const casier = casiersData[nom]?.find((c) => c.id == casierId);
        if (!casier)
          return interaction.reply({
            content: "❌ Casier introuvable.",
            ephemeral: true,
          });

        const embedCasier = new EmbedBuilder()
          .setTitle(`📂 Casier judiciaire – ${nom}`)
          .setColor(0xd63031)
          .setDescription(
            `**🔣 Casier n°${casier.id}**\n` +
              `📅 **Date** : ${casier.date}\n` +
              `🚨 **Infractions** : ${casier.infractions}\n\n` +
              `📝 **Détails** : ${casier.details}\n` +
              `⛓️ **Sanction** : ${casier.sanction}\n` +
              `🛡️ **Modérateur** : ${casier.moderateur}\n\n` +
              `📌 **Note modération** : ${casier.note}\n\n` +
              `> ${casier.recurrence}`
          );

        // Bouton retour
        const retourRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("retour")
            .setLabel("↩️ Retour")
            .setStyle(ButtonStyle.Secondary)
        );

        try {
          await interaction.update({
            embeds: [embedCasier],
            components: [retourRow],
          });
        } catch {}
      }
    });

    collector.on("end", async () => {
      try {
        await menuMessage.edit({ components: [] });
      } catch {}
    });
  },
};
