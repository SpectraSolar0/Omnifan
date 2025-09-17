module.exports = {
  name: "rename",
  description: "Renomme le salon actuel avec le nom spécifié. - admin only",
  adminOnly: true,
  async execute(message, args) {
    // Vérification des permissions
    if (!message.member.permissions.has("ManageChannels")) {
      return message.reply("❌ Tu n'as pas la permission de renommer ce salon !");
    }

    // Vérifier l'argument
    const newName = args.join(' ');
    if (!newName) {
      return message.reply("❌ Veuillez indiquer un nouveau nom pour le salon.");
    }

    try {
      // Renommer le salon
      await message.channel.setName(newName);

      // Envoyer un message de confirmation
      const confirmation = await message.channel.send(`✅ Le salon a été renommé en **${newName}**.`);
      setTimeout(() => confirmation.delete().catch(() => {}), 5000); // supprime après 5s
    } catch (err) {
      console.error(err);
      message.channel.send("❌ Une erreur est survenue lors du renommage du salon.");
    }
  }
};
