const fs = require("fs"); // <- Import manquant
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} = require("discord.js");

module.exports = {
  name: "casier",
  description: "Affiche et gère les casiers judiciaires des membres.",
  async execute(message, args, client) {
    const dataPath = "./casiers.json";

    // 🔧 Initialise le fichier si il n'existe pas
    if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, "{}");
    const casiersData = JSON.parse(fs.readFileSync(dataPath, "utf8"));

    // 🧍 Liste fixe des prénoms
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

    // === Étape 1 : Menu principal ===
    const row = new ActionRowBuilder();
    membres.forEach((nom) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`personne_${nom}`)
          .setLabel(nom)
          .setStyle(ButtonStyle.Primary)
      );
    });

    const embedMenu = new EmbedBuilder()
      .setTitle("📁 Menu des casiers judiciaires")
      .setDescription(
        "Choisis une personne pour consulter ou modifier ses casiers :"
      )
      .setColor(0x5865f2);

    let menuMessage;
    try {
      menuMessage = await message.channel.send({
        embeds: [embedMenu],
        components: [row],
      });
    } catch (err) {
      console.error("Erreur lors de l'envoi du menu principal :", err);
      return;
    }

    const collector = menuMessage.createMessageComponentCollector({
      time: 300000, // 5 minutes
    });

    collector.on("collect", async (interaction) => {
      if (!interaction.isButton()) return;
      const id = interaction.customId;

      // === Étape 2 : Afficher les casiers d'une personne ===
      if (id.startsWith("personne_")) {
        const nom = id.replace("personne_", "");
        const casiers = casiersData[nom] || [];

        const casierRow = new ActionRowBuilder();

        // Boutons de casiers existants
        if (casiers.length > 0) {
          casiers.forEach((c) => {
            casierRow.addComponents(
              new ButtonBuilder()
                .setCustomId(`casier_${nom}_${c.id}`)
                .setLabel(`Casier ${c.id}`)
                .setStyle(ButtonStyle.Secondary)
            );
          });
        }

        // ➕ Bouton pour ajouter un casier
        casierRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`add_${nom}`)
            .setLabel("➕ Ajouter un casier")
            .setStyle(ButtonStyle.Success)
        );

        const embedPerso = new EmbedBuilder()
          .setTitle(`📂 Casiers de ${nom}`)
          .setColor(0xf1c40f)
          .setDescription(
            casiers.length > 0
              ? "Choisis un casier à consulter ou ajoute-en un nouveau."
              : "❌ Aucun casier pour cette personne.\nTu peux en ajouter un avec le bouton ci-dessous."
          );

        try {
          await interaction.update({
            embeds: [embedPerso],
            components: [casierRow],
          });
        } catch (err) {
          console.warn(
            "⚠️ Impossible de modifier le message pour afficher les casiers (message supprimé ou expiré)."
          );
        }
      }

      // === Étape 3 : Ajouter un casier ===
      if (id.startsWith("add_")) {
        const nom = id.replace("add_", "");
        const filter = (m) => m.author.id === message.author.id;

        const ask = async (question) => {
          try {
            await interaction.followUp({ content: question, ephemeral: true });
            const collected = await message.channel.awaitMessages({
              filter,
              max: 1,
              time: 60000,
              errors: ["time"],
            });
            return collected.first().content;
          } catch (err) {
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

          await interaction.followUp({
            content: `✅ Casier ajouté pour **${nom}** (Casier n°${newCasier.id}) !`,
            ephemeral: true,
          });
        } catch (err) {
          await interaction.followUp({
            content: "❌ Temps écoulé ou erreur, ajout annulé.",
            ephemeral: true,
          });
        }
      }

      // === Étape 4 : Afficher un casier ===
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

        const rowDelete = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`delete_${nom}_${casier.id}`)
            .setLabel("🗑️ Supprimer ce casier")
            .setStyle(ButtonStyle.Danger)
        );

        try {
          await interaction.update({
            embeds: [embedCasier],
            components: [rowDelete],
          });
        } catch (err) {
          console.warn(
            "⚠️ Impossible de modifier le message pour afficher le casier (message supprimé ou expiré)."
          );
        }
      }

      // === Étape 5 : Supprimer un casier ===
      if (id.startsWith("delete_")) {
        const [, nom, casierId] = id.split("_");

        if (!casiersData[nom])
          return interaction.reply({
            content: "❌ Aucun casier trouvé pour cette personne.",
            ephemeral: true,
          });

        casiersData[nom] = casiersData[nom].filter((c) => c.id != casierId);
        fs.writeFileSync(dataPath, JSON.stringify(casiersData, null, 2));

        const embedDeleted = new EmbedBuilder()
          .setTitle(`🗑️ Casier supprimé`)
          .setDescription(`Le casier n°${casierId} de **${nom}** a été supprimé.`)
          .setColor(0xe74c3c);

        try {
          await interaction.update({
            embeds: [embedDeleted],
            components: [],
          });
        } catch (err) {
          console.warn(
            "⚠️ Impossible de modifier le message pour supprimer le casier (message supprimé ou expiré)."
          );
        }
      }
    });

    collector.on("end", async () => {
      try {
        await menuMessage.edit({ components: [] });
      } catch (err) {
        console.warn("⚠️ Message introuvable à la fin du collector.");
      }
    });
  },
};
