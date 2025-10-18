const { ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'shield',
  description: 'Active ou désactive les permissions pour parler avec un message de prévention.',
  async execute(message) {
    // Vérifie si l’utilisateur est admin
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return message.reply("❌ Tu n’as pas la permission d’utiliser cette commande.");
    }

    // Vérifie les permissions du bot
    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply("❌ Je n’ai pas la permission de gérer les rôles !");
    }

    // Demande l’ID du salon où envoyer le message d’alerte
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

    // Attend une interaction
    const collector = sent.createMessageComponentCollector({
      filter: i => i.user.id === message.author.id,
      time: 30000
    });

    collector.on('collect', async interaction => {
      const everyoneRole = message.guild.roles.everyone;

      if (interaction.customId === 'shield_on') {
        // Désactive la permission d’écrire
        for (const channel of message.guild.channels.cache.values()) {
          if (channel.isTextBased()) {
            await channel.permissionOverwrites.edit(everyoneRole, { SendMessages: false }).catch(() => {});
          }
        }

        await targetChannel.send("🛡️ **ALERTE SHIELD ACTIVÉ !**\nLes permissions d’envoi de messages ont été temporairement bloquées pour tout le monde.");
        await interaction.reply({ content: "✅ Shield **activé** avec succès !", ephemeral: true });

      } else if (interaction.customId === 'shield_off') {
        // Réactive la permission d’écrire
        for (const channel of message.guild.channels.cache.values()) {
          if (channel.isTextBased()) {
            await channel.permissionOverwrites.edit(everyoneRole, { SendMessages: true }).catch(() => {});
          }
        }

        await targetChannel.send("🔓 **Shield désactivé.** Tout le monde peut à nouveau parler.");
        await interaction.reply({ content: "✅ Shield **désactivé** avec succès !", ephemeral: true });
      }

      // Désactive les boutons après clic
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
