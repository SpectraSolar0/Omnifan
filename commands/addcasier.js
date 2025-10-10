const fs = require("fs");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  name: "addcasier",
  description: "Ajoute un casier judiciaire à une personne avec un menu interactif. - admin only",
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
      .setDescription("Clique sur un nom pour ajouter un casier judiciaire :")
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

      if (id.startsWith("select_")) {
        const nom = id.replace("select_", "");
        await interaction.deferReply({ ephemeral: true });

        const filter = (m) => m.author.id === message.author.id;

        const ask = async (question) => {
          await interaction.editReply({ content: question });
          try {
            const collected = await message.channel.awaitMessages({
              filter,
              max: 1,
              time: 60000,
              errors: ["time"],
            });
            return collected.first().content;
          } catch {
            return null;
          }
        };

        try {
          const date = await ask("📅 Date du casier (ex: 08/10/2025) :");
          if (!date) throw new Error("Temps écoulé");
          const infractions = await ask("🚨 Infractions :");
          const details = await ask("📝 Détails :");
          const sanction = await ask("⛓️ Sanction :");
          const moderateur = await ask("🛡️ Modérateur :");
          const note = await ask("📌 Note modération :");
          const recurrence = await ask("⚠️ Texte de récidive / surveillance :");

          if (!casiersData[nom]) casiersData[nom] = [];

          const newCasier = {
            id: casiersData[nom].length + 1,
            date,
            infractions,
            details,
            sanction,
            moderateur,
            note,
            recurrence,
          };

          casiersData[nom].push(newCasier);
          fs.writeFileSync(dataPath, JSON.stringify(casiersData, null, 2));

          await interaction.editReply({
            content: `✅ Casier ajouté pour **${nom}** (Casier n°${newCasier.id}) !`,
            components: [],
          });
        } catch (err) {
          await interaction.editReply({
            content: "❌ Temps écoulé ou erreur, ajout annulé.",
            components: [],
          });
        }
      }
    });

    collector.on("end", async () => {
      try {
        await menuMessage.edit({ components: [] });
      } catch {}
    });
  },
};
