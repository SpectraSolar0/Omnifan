const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "pan",
  description: "PAN ! Quelqu’un s’est pris une poêle ! 🍳",
  async execute(message) {
    const panImages = [
      "https://i.imgur.com/3GZQ0Wc.gif",
      "https://i.imgur.com/9yYQXwP.gif",
      "https://i.imgur.com/HuY6cpa.gif",
    ];

    const img = panImages[Math.floor(Math.random() * panImages.length)];

    const embed = new EmbedBuilder()
      .setTitle("💥 PAN !")
      .setDescription(`Ouch ! ${message.author} s’est pris une poêle sur la tête !`)
      .setImage(img)
      .setColor(0xf4a261)
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  },
};
