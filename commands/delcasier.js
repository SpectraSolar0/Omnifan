const fs = require("fs");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  name: "delcasier",
  description: "Supprime un casier judiciaire à une personne avec un menu interactif. - admin only",
  adminOnly: true,
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

    // Diviser les boutons en lignes de 5 max
    const rows = [];
    const boutonsParLigne = 5;
    for (let i = 0; i < membres.length; i += boutonsParLigne) {
      const row = new ActionRowBuilder();
      const chunk = membres.slice(i, i + boutonsParLigne);
      chunk.forEach((nom) => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`select_${nom}`)
            .setLabel(nom)
            .setStyle(ButtonStyle.Primary)
        );
      });
      rows.push(row);
    }

    const embedMenu = new EmbedBuilder()
      .setTitle("📁 Sélectionne une personne")
      .setDescription("Clique sur un nom pour supprimer un casier judiciaire :")
      .setColor(0xd63031);

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

    const collector = menuMessage.createMessageComponentCollector({ time: 300000 });

    collector.on("collect", async (interaction) => {
      if (!interaction.isButton()) return;
      const id = interaction.customId;

      if (id.startsWith("select_")) {
        const nom = id.replace("select_", "");
        await interaction.deferReply({ ephemeral: true });

        const casiers = casiersData[nom] || [];

        if (casiers.length === 0) {
          return interaction.editReply(`❌ ${nom} n'a aucun casier.`);
        }

        // Créer les boutons pour chaque casier
        const casierRows = [];
        for (let i = 0; i < casiers.length; i += 5) {
          const row = new ActionRowBuilder();
          const chunk = casiers.slice(i, i + 5);
          chunk.forEach((c) => {
            row.addComponents(
              new ButtonBuilder()
                .setCustomId(`del_${nom}_${c.id}`)
                .setLabel(`Casier ${c.id}`)
                .setStyle(ButtonStyle.Danger)
            );
          });
          casierRows.push(row);
        }

        const embedCasiers = new EmbedBuilder()
          .setTitle(`📂 Casier(s) de ${nom}`)
          .setDescription("Clique sur un casier pour le supprimer.")
          .setColor(0xe74c3c);

        await interaction.editReply({ embeds: [embedCasiers], components: casierRows });
      }

      // Supprimer un casier
      if (id.startsWith("del_")) {
        const [, nom, casierId] = id.split("_");
        if (!casiersData[nom] || casiersData[nom].length === 0) {
          return interaction.editReply("❌ Aucun casier trouvé.");
        }

        const index = casiersData[nom].findIndex((c) => c.id == casierId);
        if (index === -1) {
          return interaction.editReply(`❌ Casier n°${casierId} introuvable pour ${nom}.`);
        }

        casiersData[nom].splice(index, 1);
        fs.writeFileSync(dataPath, JSON.stringify(casiersData, null, 2));

        await interaction.editReply(`✅ Casier n°${casierId} de **${nom}** supprimé !`);
      }
    });

    collector.on("end", async () => {
      try {
        await menuMessage.edit({ components: [] });
      } catch {}
    });
  },
};
