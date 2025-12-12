module.exports = {
  name: "clear",
  description: "Supprime un nombre de messages spécifié ou max (500). - admin only",
  adminOnly: true,
  moderatorOnly: true,
  async execute(message, args) {
    // Vérification des permissions
    if (!message.member.permissions.has("ManageMessages")) {
      return message.reply("❌ Tu n'as pas la permission de gérer les messages !");
    }

    if (!args[0]) {
      return message.reply("❌ Utilisation : `!clear <nombre|max>`");
    }

    let amount;

    // Gestion du "max"
    if (args[0].toLowerCase() === "max") {
      amount = 500;
    } else {
      amount = parseInt(args[0]);
      if (isNaN(amount) || amount <= 0 || amount > 500) {
        return message.reply("❌ Veuillez indiquer un nombre valide entre 1 et 500 ou `max`.");
      }
    }

    let deleted = 0;

    try {
      while (deleted < amount) {
        const toDelete = Math.min(100, amount - deleted);

        const messages = await message.channel.messages.fetch({ limit: toDelete });
        if (messages.size === 0) break;

        await message.channel.bulkDelete(messages, true);
        deleted += messages.size;
      }

      const confirmation = await message.channel.send(
        `🧹 **${deleted} messages supprimés.**`
      );

      setTimeout(() => confirmation.delete().catch(() => {}), 5000);

    } catch (err) {
      console.error(err);
      message.channel.send(
        "❌ Impossible de supprimer les messages (certains ont peut-être plus de 14 jours)."
      );
    }
  }
};
