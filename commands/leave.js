module.exports = {
  name: "leave",
  description: "Fait quitter le bot d’un serveur spécifié via son numéro. - admin only",
  adminOnly: true,
  async execute(message, args) {
    // Vérifie qu’un numéro de serveur est fourni
    const serverIndex = parseInt(args[0]);
    if (isNaN(serverIndex)) {
      return message.reply("❌ Merci d’indiquer le **numéro du serveur**.\nExemple : `+leave 1`");
    }

    // Récupère tous les serveurs (guilds) où le bot est présent
    const guilds = [...message.client.guilds.cache.values()];
    const targetGuild = guilds[serverIndex - 1]; // car la liste commence à 0

    // Vérifie que le numéro correspond bien à un serveur
    if (!targetGuild) {
      return message.reply("❌ Aucun serveur trouvé avec ce numéro !");
    }

    try {
      // Confirmation avant de quitter
      await message.reply(`⚠️ Le bot va quitter le serveur **${targetGuild.name}** (${targetGuild.id}).`);

      // Quitter le serveur
      await targetGuild.leave();

      // Message de succès
      message.channel.send(`✅ Le bot a quitté le serveur **${targetGuild.name}**.`);
    } catch (err) {
      console.error(err);
      message.reply("❌ Impossible de quitter ce serveur. Vérifie les permissions ou réessaie plus tard.");
    }
  }
};
