const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ActivityType
} = require("discord.js");

let shieldStatus = false;
let panelExists = false;

const ALLOWED_CHANNEL_ID = "1449195004449914941"; // ⬅️ METS L’ID ICI

module.exports = {
  name: "shield",
  description: "Panel de contrôle du shield",
  adminOnly: true,
  moderatorOnly: true,

  async execute(message, args) {
    // ❌ Mauvais salon
    if (message.channel.id !== ALLOWED_CHANNEL_ID) {
      return message.reply("❌ Cette commande ne peut être utilisée que dans le salon autorisé.");
    }

    // Vérification des permissions
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
    }

    // ❌ Panel déjà existant
    if (panelExists) {
      return message.reply("⚠️ Un panel shield est déjà actif.");
    }

    panelExists = true;

    const guild = message.guild;
    const client = message.client;

    const ROLE_NORMAL = "1416853527002873858";
    const ROLE_SHIELD = "1449189420904480959";
    const ALERT_CHANNEL_ID = "1449194695996739696";

    const getEmbed = () =>
      new EmbedBuilder()
        .setTitle("🛡️ SYSTÈME DE SHIELD — PANNEAU DE CONTRÔLE")
        .setColor(shieldStatus ? 0x2ecc71 : 0xe74c3c)
        .setDescription(
          `### 📊 Statut du Shield\n` +
          `${shieldStatus ? "🟢 **ACTIVÉ**" : "🔴 **DÉSACTIVÉ**"}\n\n` +
          `### ℹ️ Informations\n` +
          `• Panel sécurisé (salon unique)\n` +
          `• Statut du bot synchronisé\n` +
          `• Application globale des rôles\n\n` +
          `### 🎛️ Contrôles\n` +
          `Utilise les boutons ci-dessous pour gérer le shield.`
        )
        .setFooter({ text: "Système de sécurité du serveur" })
        .setTimestamp();

    const getButtons = () =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("shield_on")
          .setLabel("Activer le Shield")
          .setStyle(ButtonStyle.Success)
          .setDisabled(shieldStatus),

        new ButtonBuilder()
          .setCustomId("shield_off")
          .setLabel("Désactiver le Shield")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(!shieldStatus)
      );

    const panelMessage = await message.channel.send({
      embeds: [getEmbed()],
      components: [getButtons()]
    });

    const collector = panelMessage.createMessageComponentCollector();

    collector.on("collect", async interaction => {
      if (interaction.channel.id !== ALLOWED_CHANNEL_ID) {
        return interaction.reply({
          content: "❌ Interaction non autorisée dans ce salon.",
          ephemeral: true
        });
      }

      if (!interaction.member.permissions.has("Administrator")) {
        return interaction.reply({
          content: "❌ Permission refusée.",
          ephemeral: true
        });
      }

      await interaction.deferUpdate();
      const members = await guild.members.fetch();

      // 🟢 ACTIVER
      if (interaction.customId === "shield_on") {
        shieldStatus = true;

        for (const member of members.values()) {
          try {
            if (member.roles.cache.has(ROLE_NORMAL)) {
              await member.roles.remove(ROLE_NORMAL);
            }
            if (!member.roles.cache.has(ROLE_SHIELD)) {
              await member.roles.add(ROLE_SHIELD);
            }
          } catch {}
        }

        client.user.setPresence({
          status: "dnd",
          activities: [{ name: "🛡️ Shield ACTIVÉ", type: ActivityType.Watching }]
        });

        const alertChannel = guild.channels.cache.get(ALERT_CHANNEL_ID);
        if (alertChannel) {
          const alertEmbed = new EmbedBuilder()
            .setTitle("🚨 ALERTE SÉCURITÉ — ÉTAT CRITIQUE")
            .setColor(0xe74c3c)
            .setDescription(
              "Le serveur est actuellement dans un **état critique**.\n\n" +
              "🛡️ Le **shield de sécurité** est activé.\n\n" +
              "👮‍♂️ Le staff est mobilisé et travaille activement.\n\n" +
              "Merci de rester calme."
            )
            .setTimestamp();

          await alertChannel.send({ embeds: [alertEmbed] });
        }
      }

      // 🔴 DÉSACTIVER
      if (interaction.customId === "shield_off") {
        shieldStatus = false;

        for (const member of members.values()) {
          try {
            if (member.roles.cache.has(ROLE_SHIELD)) {
              await member.roles.remove(ROLE_SHIELD);
            }
            if (!member.roles.cache.has(ROLE_NORMAL)) {
              await member.roles.add(ROLE_NORMAL);
            }
          } catch {}
        }

        client.user.setPresence({
          status: "online",
          activities: [{ name: "🛡️ Shield DÉSACTIVÉ", type: ActivityType.Watching }]
        });
      }

      await panelMessage.edit({
        embeds: [getEmbed()],
        components: [getButtons()]
      });
    });

    collector.on("end", () => {
      panelExists = false;
    });
  }
};
