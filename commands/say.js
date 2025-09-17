module.exports = {
  name: "say",
  description: "Fait parler le bot avec le message spécifié. - admin only",
  adminOnly: true,
  async execute(message, args) {
    if (!args.length) return message.reply("❌ Tu dois fournir un message à dire.");

    const text = args.join(" ");

    try {
      await message.channel.send(text);
      if (message.deletable) message.delete().catch(() => {});
    } catch (err) {
      console.error(err);
      message.channel.send("❌ Impossible d'envoyer le message.");
    }
  }
};
