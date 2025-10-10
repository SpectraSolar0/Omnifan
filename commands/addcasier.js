const { getCasiers, updateCasiers } = require("../jsonbin");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  name: "addcasier",
  description: "Ajoute un casier judiciaire à un membre. - admin only",
  adminOnly: true,
  async execute(message) {
    const membres = [
      "Mr Diego", "Mr Léo F.", "Mr Fromage", "Mlle Léo L.", "Mr Afraaz",
      "Mr Joachim", "Mr Miniburger", "Mr Gabriel", "Mr Adam", "Mr Estaban",
      "Mr Martin", "Mr Antoine", "Mlle Maryne", "Mr Alhumam", "Mr Cyprien",
      "Mr Justin", "Mr Noa", "Mr Aldo"
    ];

    const casiersData = await getCasiers();

    // Créer menu boutons comme dans ton addcasier original
    const rows = [];
    const maxBoutons = 5;
    for (let i = 0; i < membres.length; i += maxBoutons) {
      const row = new ActionRowBuilder();
      membres.slice(i, i + maxBoutons).forEach(nom => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`select_${nom}`)
            .setLabel(nom)
            .setStyle(ButtonStyle.Primary)
        );
      });
      rows.push(row);
    }

    const embed = new EmbedBuilder()
      .setTitle("📁 Sélectionne une personne")
      .setDescription("Clique sur un membre pour ajouter un casier judiciaire.")
      .setColor(0x5865f2);

    const menuMessage = await message.channel.send({ embeds: [embed], components: rows });

    const collector = menuMessage.createMessageComponentCollector({ time: 300000 });

    collector.on("collect", async interaction => {
      if (!interaction.isButton()) return;
      const nom = interaction.customId.replace("select_", "");
      await interaction.deferReply({ ephemeral: true });

      const filter = m => m.author.id === message.author.id;
      const ask = async question => {
        await interaction.editReply({ content: question });
        const collected = await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] });
        return collected.first()?.content;
      };

      try {
        const date = await ask("📅 Date du casier :");
        const infractions = await ask("🚨 Infractions :");
        const details = await ask("📝 Détails :");
        const sanction = await ask("⛓️ Sanction :");
        const moderateur = await ask("🛡️ Modérateur :");
        const note = await ask("📌 Note modération :");
        const recurrence = await ask("⚠️ Texte récidive :");

        if (!casiersData[nom]) casiersData[nom] = [];
        const newCasier = { id: casiersData[nom].length + 1, date, infractions, details, sanction, moderateur, note, recurrence };
        casiersData[nom].push(newCasier);

        await updateCasiers(casiersData);

        await interaction.editReply({ content: `✅ Casier ajouté pour **${nom}** !`, components: [] });
      } catch {
        await interaction.editReply({ content: "❌ Temps écoulé ou erreur, ajout annulé.", components: [] });
      }
    });
  },
};
