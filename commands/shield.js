const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  EmbedBuilder
} = require('discord.js');

module.exports = {
  name: 'shield',
  description: 'Active ou désactive les permissions pour parler avec un message de prévention en embed.',
  adminOnly: true
  async execute(message) {
    // Vérifie les permissions du bot
    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply("❌ Je n’ai pas la permission de gérer les rôles !");
    }

    // Demande l’ID du salon d’annonce
    await message.reply("🛡️ Envoie maintenant **l’ID du salon** où je dois envoyer le message de prévention du shield :");

    const filter = m => m.author.id === message.author.id;
    const collected = await message.channel.awaitMessages({ filter, max: 1, time: 30000 });

    if (!collected.size) return message.reply("⏰ Temps écoulé, commande annulée.");

    const channelId = collected.first().content.trim();
    const targetChannel = message.guild.channels.cache.get(channelId);

    if (!targetChannel) {
      return message.reply("❌ ID de salon invalide. Commande annulée.");
    }

    // Crée les boutons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('shield_on')
        .setLabel('🟢 Activer')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('shield_off')
        .setLabel('🔴 Désactiver')
        .setStyle(ButtonStyle.Danger)
    );

    // Envoie les boutons
    const sent = await message.reply({
      content: `Choisis une action pour le **Shield** :`,
      components: [row]
    });

    // Collecteur d’interactions
    const collector = sent.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 30000
    });

    collector.on('collect', async interaction => {
      const everyoneRole = message.guild.roles.everyone;

      if (interaction.customId === 'shield_on') {
        // 🔒 SHIELD ACTIVÉ
        for (const channel of message.guild.channels.cache.values()) {
          if (channel.isTextBased()) {
            await channel.permissionOverwrites.edit(everyoneRole, { SendMessages: false }).catch(() => {});
          }
        }

        const embedOn = new EmbedBuilder()
          .setTitle("🛡️ SHIELD ACTIVÉ")
          .setDescription(
            "Le mode **Shield** vient d’être **activé**.\n\n" +
            "🔒 Les permissions d’envoi de messages ont été **bloquées** pour tout le monde.\n" +
            "⚠️ Ce mode protège le serveur contre le spam ou les attaques.\n\n" +
            "👉 Un modérateur pourra le désactiver avec la commande `!shield`."
          )
          .setColor(0xff0000)
          .setThumbnail("https://cdn-icons-png.flaticon.com/512/1048/1048945.png")
          .setFooter({ text: `Serveur : ${message.guild.name}`, iconURL: message.guild.iconURL() })
          .setTimestamp();

        await targetChannel.send({ embeds: [embedOn] });
        await interaction.reply({ content: "✅ Shield **activé** avec succès !", ephemeral: true });

      } else if (interaction.customId === 'shield_off') {
        // 🔓 SHIELD DÉSACTIVÉ
        for (const channel of message.guild.channels.cache.values()) {
          if (channel.isTextBased()) {
            await channel.permissionOverwrites.edit(everyoneRole, { SendMessages: true }).catch(() => {});
          }
        }

        const embedOff = new EmbedBuilder()
          .setTitle("🔓 SHIELD DÉSACTIVÉ")
          .setDescription(
            "Le mode **Shield** vient d’être **désactivé**.\n\n" +
            "✅ Les permissions d’envoi de messages sont de nouveau **autorisées**.\n" +
            "💬 Les membres peuvent maintenant parler librement dans les salons.\n\n" +
            "⚙️ Restez vigilants, nous relancerons le shield si besoin."
          )
          .setColor(0x00ff00)
          .setThumbnail("https://cdn-icons-png.flaticon.com/512/992/992700.png")
          .setFooter({ text: `Serveur : ${message.guild.name}`, iconURL: message.guild.iconURL() })
          .setTimestamp();

        await targetChannel.send({ embeds: [embedOff] });
        await interaction.reply({ content: "✅ Shield **désactivé** avec succès !", ephemeral: true });
      }

      // Désactivation des boutons
      row.components.forEach(button => button.setDisabled(true));
      await sent.edit({ components: [row] });
      collector.stop();
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        row.components.forEach(button => button.setDisabled(true));
        sent.edit({ content: "⏰ Temps écoulé, aucune action choisie.", components: [row] });
      }
    });
  }
};
