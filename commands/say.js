const { MessageEmbed, EmbedBuilder } = require("discord.js");

module.exports = {
  name: "say",
  description: "Envoie un message via le bot dans un salon choisi.",
  adminOnly: true,
  async execute(message, args, client) {
    const filter = (m) => m.author.id === message.author.id;

    try {
      // 1️⃣ Demande du salon
      await message.channel.send("💬 Dans quel salon veux-tu envoyer le message ? Mentionne le salon (ex: #général)");
      const collectedChannel = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 900000,
        errors: ["time"],
      });
      const channelMention = collectedChannel.first().mentions.channels.first();
      if (!channelMention) return message.channel.send("❌ Salon invalide !");
      const targetChannel = channelMention;

      // 2️⃣ Demande du titre
      await message.channel.send("✏️ Quel est le titre de l'embed ?");
      const collectedTitle = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 60000,
        errors: ["time"],
      });
      const title = collectedTitle.first().content;

      // 3️⃣ Demande du contenu
      await message.channel.send("📝 Quel est le contenu du message ?");
      const collectedContent = await message.channel.awaitMessages({
        filter,
        max: 1,
        time: 60000,
        errors: ["time"],
      });
      const content = collectedContent.first().content;

      // 4️⃣ Envoi de l'embed dans le salon choisi
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(content)
        .setColor(0x5865f2)
        .setFooter({ text: `Envoyé par ${message.author.tag}` });

      await targetChannel.send({ embeds: [embed] });
      await message.channel.send(`✅ Message envoyé dans ${targetChannel}`);
    } catch (err) {
      console.error(err);
      message.channel.send("❌ Temps écoulé ou erreur lors de la saisie.");
    }
  },
};
