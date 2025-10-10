const { getCasiers, updateCasiers } = require("../jsonbin");
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} = require("discord.js");

module.exports = {
  name: "delcasier",
  description: "Supprime un casier judiciaire à un membre. - admin only",
  adminOnly: true,
  async execute(message) {
    const membres = [
      "Mr Diego", "Mr Léo F.", "Mr Fromage", "Mlle Léo L.", "Mr Afraaz",
      "Mr Joachim", "Mr Miniburger", "Mr Gabriel", "Mr Adam", "Mr Estaban",
      "Mr Martin", "Mr Antoine", "Mlle Maryne", "Mr Alhumam", "Mr Cyprien",
      "Mr Justin", "Mr Noa", "Mr Aldo"
    ];

    const casiersData = await getCasiers();

    const rows = [];
    const maxBoutons = 5;
    for (let i = 0; i < membres.length; i += maxBoutons) {
      const row = new ActionRowBuilder();
      membres.slice(i, i + maxBoutons).forEach(nom => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`selectdel_${nom}`)
            .setLabel(nom)
            .setStyle(ButtonStyle.Primary)
        );
      });
      rows.push(row);
    }

    const embed = new EmbedBuilder()
      .setTitle("📁 Sélectionne une personne")
      .setDescription("Clique sur un membre pour supprimer un casier.")
      .setColor(0xe74c3c);

    const menuMessage = await message.channel.send({ embeds: [embed], components: rows });

    const collector = menuMessage.createMessageComponentCollector({ time: 300000 });

    collector.on("collect", async interaction => {
      if (!interaction.isButton()) return;
      const nom = interaction.customId.replace("selectdel_", "");
      const casiers = casiersData[nom] || [];

      if (casiers.length === 0) {
        return interaction.reply({ content: `❌ ${nom} n'a aucun casier.`, ephemeral: true });
      }

      const casierRows = [];
      for (let i = 0; i < casiers.length; i += 5) {
        const row = new ActionRowBuilder();
        casiers.slice(i, i + 5).forEach(c => {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`del_${nom}_${c.id}`)
              .setLabel(`Casier ${c.id}`)
              .setStyle(ButtonStyle.Danger)
          );
        });
        casierRows.push(row);
      }

      await interaction.reply({ content: "Sélectionne le casier à supprimer :", components: casierRows, ephemeral: true });

      const delCollector = interaction.channel.createMessageComponentCollector({ time: 300000 });
      delCollector.on("collect", async i2 => {
        if (!i2.isButton() || !i2.customId.startsWith("del_")) return;
        const [, nom2, id] = i2.customId.split("_");
        casiersData[nom2] = casiersData[nom2].filter(c => c.id != id);
        await updateCasiers(casiersData);
        await i2.update({ content: `✅ Casier n°${id} de ${nom2} supprimé !`, components: [] });
      });
    });
  },
};
