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

    const susTexts = [
      "Quelque chose ne va pas ici... 👀",
      "C’est vraiment suspicieux ! 🔍",
      "Hmm… je sens la trahison… 😳",
      "Les imposteurs sont parmi nous ! 🚨",
      "Attention, ça sent le sus ! 🕵️",
      "Quelque chose cloche ici… 😬",
      "Hmm… je ne fais pas confiance… 😏",
    ];

    // Choisir un GIF/image aléatoire
    const img = susImages[Math.floor(Math.random() * susImages.length)];

    // Choisir un texte aléatoire
    const randomText = susTexts[Math.floor(Math.random() * susTexts.length)];

    const embed = new EmbedBuilder()
      .setTitle("That's kinda sus...")
      .setDescription(randomText)
      .setImage(img)
      .setColor(0xff5c5c)
      .setFooter({ text: "Sus detector™" })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  },
};
