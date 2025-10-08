const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "fromage",
  description: "Envoie un fromage aléatoire et une citation philosophique 🧀",
  async execute(message) {
    const fromageImages = [
      "https://i.imgur.com/ILa2x2b.jpg",
      "https://i.imgur.com/8Y7QJfK.jpg",
      "https://i.imgur.com/HQkCq1y.jpg",
    ];

    const citations = [
      "Le brie unit les peuples.",
      "Un plateau de fromage par jour éloigne la mauvaise humeur.",
      "Le camembert n’est pas un choix, c’est un mode de vie.",
      "Fromage + vin = paix mondiale (théorie non vérifiée).",
    ];

    const img = fromageImages[Math.floor(Math.random() * fromageImages.length)];
    const citation = citations[Math.floor(Math.random() * citations.length)];

    const embed = new EmbedBuilder()
      .setTitle("🧀 Fromage du jour")
      .setDescription(citation)
      .setImage(img)
      .setColor(0xffdd57)
      .setFooter({ text: "Service fromager officiel" })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  },
};
