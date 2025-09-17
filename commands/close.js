module.exports = {
  name: "close",
  description: "Ferme la plainte actuel",
  adminOnly: true, // seul admin ferme le ticket

  async execute(message) {
    if (!message.channel.name.startsWith("ticket-")) {
      return message.reply("❌ Cette commande doit être utilisée dans une plainte.");
    }

    await message.reply("✅ Cette plainte sera fermé dans 3 secondes...");
    setTimeout(() => message.channel.delete().catch(() => {}), 3000);
  },
};
