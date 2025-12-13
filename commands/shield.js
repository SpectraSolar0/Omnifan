const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ActivityType
} = require("discord.js");

let shieldStatus = false;      // false = désactivé | true = activé
let panelExists = false;      // empêche plusieurs panels
let panelMessageId = null;    // ID du panel actif

module.exports = {
  name: "shield",
  description: "Panel de contrôle du shield",
  adminOnly: true,
  moderatorOnly: false,

  async execute(message, args) {
    // Vérification des permissions
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ Tu n'as pas la permission d'utiliser cette commande.");
    }

    // ❌ Panel déjà existant
    if (panelExists) {
      return message.reply("⚠️ Un **panel shield est déjà actif**. Utilise celui-ci.");
    }

    panelExists = true;

    const guild = message.guild;
    const client = message.client;

    const ROLE_NORMAL = "1416853527002873858";
    const ROLE_SHIELD = "1449189420904480959";
    const ALERT_CHANNEL_ID = "1449190280669429830";

    // 🧠 UI
    const getEmbed = () =>
      new EmbedBuilder()
        .setTitle("🛡️ SYSTÈME DE SHIELD — PANNEAU DE CONTRÔLE")
        .setColor(shieldStatus ? 0x2ecc71 : 0xe74c3c)
        .setDescription(
          `### 📊 Statut du Shield\n` +
          `${shieldStatus ? "🟢 **ACTIVÉ**" : "🔴 **DÉSACTIVÉ**"}\n\n` +
          `### ℹ️ Informations\n` +
          `• Rôles de sécurité appliqués globalement\n` +
          `• Statut du bot synchronisé\n` +
          `• Panel unique (sécurité renforcée)\n\n` +
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

    // 📤 Envoi du panel
    const panelMessage = await message.channel.send({
      embeds: [getEmbed()],
      components: [getButtons()]
    });

    panelMessageId = panelMessage.id;

    // 🎛️ Collector
    const collector = panelMessage.createMessageComponentCollector();

    collector.on("collect", async interaction => {
      if (!interaction.member.permissions.has("Administrator")) {
        return interaction.reply({
          content: "❌ Tu n'as pas la permission.",
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
              "🛡️ Le **shield de sécurité** a été activé.\n\n" +
              "👮‍♂️ Le staff est mobilisé et travaille activement.\n\n" +
              "Merci de rester calme et de respecter les consignes."
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

    // 🧹 Si le panel est supprimé → autorise un nouveau panel
    collector.on("end", () => {
      panelExists = false;
      panelMessageId = null;
    });
  }
};
