const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: "clear",
  description: "Supprimer des messages (user / bots / all)",
  moderatorOnly: true,
  adminOnly: true,
  ownerOnly: true,

  async execute(message, args) {
    if (
      !message.member.permissions.has(
        PermissionsBitField.Flags.ManageMessages
      )
    ) {
      return message.reply("❌ Tu n'as pas la permission de gérer les messages.");
    }

    if (!args.length) {
      return message.reply(
        "❌ Utilisation :\n" +
        "`+clear 20`\n" +
        "`+clear user @pseudo 20`\n" +
        "`+clear bots 50`\n" +
        "`+clear all`"
      );
    }

    const sub = args[0].toLowerCase();
    let deleted = 0;

    try {
      // ======================
      // +clear all
      // ======================
      if (sub === "all") {
        const fetched = await message.channel.messages.fetch({ limit: 100 });
        const filtered = fetched.filter(m => !m.pinned);

        const result = await message.channel.bulkDelete(filtered, true);
        deleted = result.size;
      }

      // ======================
      // +clear bots 50
      // ======================
      else if (sub === "bots") {
        const amount = parseInt(args[1]) || 100;

        if (amount < 1 || amount > 100) {
          return message.reply("❌ Nombre entre 1 et 100.");
        }

        const fetched = await message.channel.messages.fetch({ limit: 100 });
        const filtered = fetched.filter(
          m => m.author.bot && !m.pinned
        ).first(amount);

        const result = await message.channel.bulkDelete(filtered, true);
        deleted = result.size;
      }

      // ======================
      // +clear user @pseudo 20
      // ======================
      else if (sub === "user") {
        const member =
          message.mentions.members.first() ||
          message.guild.members.cache.get(args[1]);

        if (!member) {
          return message.reply("❌ Mentionne un utilisateur valide.");
        }

        const amount = parseInt(args[2]) || 100;

        if (amount < 1 || amount > 100) {
          return message.reply("❌ Nombre entre 1 et 100.");
        }

        const fetched = await message.channel.messages.fetch({ limit: 100 });
        const filtered = fetched.filter(
          m => m.author.id === member.id && !m.pinned
        ).first(amount);

        const result = await message.channel.bulkDelete(filtered, true);
        deleted = result.size;
      }

      // ======================
      // +clear 20
      // ======================
      else {
        const amount = parseInt(sub);

        if (!amount || amount < 1 || amount > 100) {
          return message.reply("❌ Nombre entre 1 et 100.");
        }

        const result = await message.channel.bulkDelete(amount, true);
        deleted = result.size;
      }

      const confirm = await message.channel.send(
        `🧹 **${deleted} message(s) supprimé(s).**`
      );

      setTimeout(() => confirm.delete().catch(() => {}), 5000);
    } catch (err) {
      console.error(err);
      message.reply(
        "❌ Erreur lors de la suppression (messages trop anciens ?)."
      );
    }
  }
};
