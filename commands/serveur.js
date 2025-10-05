const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "serveur",
  description: "Affiche la liste des serveurs où le bot est présent. - admin only",
  adminOnly: true,
  async execute(message, args) {
    try {
      const guilds = [...message.client.guilds.cache.values()];

      if (guilds.length === 0) {
        return message.reply("❌ Le bot n'est actuellement présent dans aucun serveur.");
      }

      // Pagination : 10 serveurs par page
      const itemsPerPage = 10;
      const totalPages = Math.ceil(guilds.length / itemsPerPage);
      let currentPage = 0;

      const generateEmbed = (page) => {
        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const serverList = guilds.slice(start, end)
          .map((guild, index) => 
            `**${start + index + 1}.** ${guild.name}\n> 👥 ${guild.memberCount} membres\n> 🆔 ${guild.id}`
          )
          .join("\n\n");

        return new EmbedBuilder()
          .setColor("#2b2d31")
          .setTitle("📋 Liste des serveurs du bot")
          .setDescription(serverList || "Aucun serveur à afficher.")
          .setFooter({ text: `Page ${page + 1}/${totalPages} • Utilise ⬅️ ➡️ pour naviguer` })
          .setTimestamp();
      };

      // Envoi du premier embed
      const embedMessage = await message.channel.send({ embeds: [generateEmbed(currentPage)] });

      // Si un seul embed suffit, inutile d’ajouter les réactions
      if (totalPages <= 1) return;

      // Ajoute les réactions de navigation
      await embedMessage.react("⬅️");
      await embedMessage.react("➡️");

      // Crée un collecteur de réactions
      const filter = (reaction, user) =>
        ["⬅️", "➡️"].includes(reaction.emoji.name) && user.id === message.author.id;

      const collector = embedMessage.createReactionCollector({ filter, time: 120000 }); // 2 min

      collector.on("collect", async (reaction, user) => {
        await reaction.users.remove(user.id); // Retire la réaction de l’utilisateur

        if (reaction.emoji.name === "➡️") {
          if (currentPage < totalPages - 1) currentPage++;
        } else if (reaction.emoji.name === "⬅️") {
          if (currentPage > 0) currentPage--;
        }

        await embedMessage.edit({ embeds: [generateEmbed(currentPage)] });
      });

      collector.on("end", () => {
        embedMessage.reactions.removeAll().catch(() => {});
      });

    } catch (err) {
      console.error(err);
      message.reply("❌ Une erreur est survenue lors de la récupération des serveurs.");
    }
  }
};
