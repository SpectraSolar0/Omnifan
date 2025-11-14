module.exports = {
  name: "clear",
  description: "Supprime un nombre de messages spécifié. - admin only",
  adminOnly: true,
  moderatorOnly: true,
  async execute(message, args) {
    // Vérification des permissions
    if (!message.member.permissions.has("ManageMessages")) {
      return message.reply("❌ Tu n'as pas la permission de gérer les messages !");
    }

    // Vérifier l'argument
    const amount = parseInt(args[0]);
    if (!amount || isNaN(amount) || amount <= 0 || amount > 100) {
      return message.reply("❌ Veuillez indiquer un nombre valide entre 1 et 100.");
    }

    try {
      // Supprimer les messages
      await message.channel.bulkDelete(amount, true);

      // Envoyer un message temporaire de confirmation
      const confirmation = await message.channel.send(`✅ ${amount} messages ont été supprimés.`);
      setTimeout(() => confirmation.delete().catch(() => {}), 5000); // supprime après 5s
    } catch (err) {
      console.error(err);
      message.channel.send("❌ Impossible de supprimer les messages. Ils peuvent être trop anciens (>14 jours).");
    }
  }
};
