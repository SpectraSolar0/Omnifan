module.exports = {
  name: "add",
  description: "Ajoute un membre à une plainte (salon actuel) - admin only.",
  adminOnly: true,
  moderatorOnly: true,
  async execute(message, args) {
    if (!message.member.permissions.has("ManageChannels")) {
      return message.reply("❌ Tu n'as pas la permission de gérer ce salon !");
    }

    const member = message.mentions.members.first();
    if (!member) return message.reply("❌ Mentionne un utilisateur à ajouter.");

    try {
      await message.channel.permissionOverwrites.edit(member.id, {
        ViewChannel: true,
        SendMessages: true
      });
      message.channel.send(`✅ ${member} a été ajouté à la plainte.`)
        .then(msg => setTimeout(() => msg.delete().catch(() => {}), 5000));
    } catch (err) {
      console.error(err);
      message.channel.send("❌ Impossible d'ajouter ce membre à la plainte.");
    }
  }
};
