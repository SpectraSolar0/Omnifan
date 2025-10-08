const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "sus",
  description: "Détecte quelque chose de louche... 😳",
  async execute(message) {
    const susImages = [
      "https://i.imgur.com/7kM0yVY.png",
      "https://i.imgur.com/0Z8Yq1J.gif",
      "https://i.imgur.com/MJ7kOyd.jpeg",
    ];

    const img = susImages[Math.floor(Math.random() * susImages.length)];

    const embed = new EmbedBuilder()
      .setTitle("That's kinda sus...")
      .setDescription(`**${message.author.username}** a détecté quelque chose de louche ! 👀`)
      .setImage(img)
      .setColor(0xff5c5c)
      .setFooter({ text: "Sus detector™" })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  },
};
