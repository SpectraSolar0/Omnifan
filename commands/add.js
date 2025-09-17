const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: "add",
  description: "Ajoute un utilisateur à la plainte",
  adminOnly: true,

  async execute(message, args) {
    if (!message.channel.name.startsWith("ticket-")) {
      return message.reply("❌ Cette commande doit être utilisée dans une plainte.");
    }

    const userId = args[0];
    if (!userId) return message.reply("❌ Utilisation : +add <id_utilisateur>");

    try {
      await message.channel.permissionOverwrites.edit(userId, {
        ViewChannel: true,
        SendMessages: true,
      });
      message.reply(`✅ L’utilisateur <@${userId}> a été ajouté à la plainte.`);
    } catch (err) {
      console.error(err);
      message.reply("❌ Impossible d’ajouter cet utilisateur à la plainte.");
    }
  },
};
