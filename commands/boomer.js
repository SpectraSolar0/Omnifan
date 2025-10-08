module.exports = {
  name: "boomer",
  description: "Fait une remarque typique d’un boomer 👴",
  async execute(message) {
    const boomerQuotes = [
      "Dans mon temps, on marchait 10 km pour aller à l’école. Sous la neige. En tongs.",
      "Les jeunes d’aujourd’hui n’ont plus de respect pour la politesse.",
      "Avant, on n’avait pas Internet, et on s’en sortait très bien !",
      "Radio ? C’est quoi ce truc qui marche sans fil ?",
      "Avant, on avait des vraies blagues, pas ces trucs modernes !",
    ];

    const quote = boomerQuotes[Math.floor(Math.random() * boomerQuotes.length)];
    const target = message.mentions.users.first();
    const mention = target ? `${target} → ` : "";

    await message.channel.send(`${mention}"${quote}" — *BoomeR*`);
  },
};
