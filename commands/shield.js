const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ActivityType
} = require("discord.js");

let shieldStatus = false;
let panelExists = false;

const ALLOWED_CHANNEL_ID = "1449195004449914941";
const ROLE_NORMAL = "1416853527002873858";
const ROLE_SHIELD = "1449189420904480959";
const ALERT_CHANNEL_ID = "1449194695996739696";

module.exports = {
  name: "shield",
  description: "Panel avancé de gestion du shield",
  adminOnly: true,
  moderatorOnly: true,

  async execute(message) {
    // Salon unique
    if (message.channel.id !== ALLOWED_CHANNEL_ID) {
      return message.reply("❌ Cette commande est limitée au salon du panel.");
    }

    // Permissions
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ Permission refusée.");
    }

    // Panel unique
    if (panelExists) {
      return message.reply("⚠️ Le panel shield est déjà actif.");
    }

    panelExists = true;

    const guild = message.guild;
    const client = message.client;

    /* ================= PANEL ================= */

    const panelEmbed = () =>
      new EmbedBuilder()
        .setTitle("🛡️ SYSTÈME DE SHIELD — PANNEAU PRINCIPAL")
        .setColor(shieldStatus ? 0x00ff99 : 0xff3333)
        .setDescription(
          `## 📊 ÉTAT ACTUEL DU SHIELD\n` +
          `${shieldStatus ? "🟢 **ACTIVÉ — NIVEAU CRITIQUE**" : "🔴 **DÉSACTIVÉ — SERVEUR OUVERT**"}\n\n` +

          `## 🧠 FONCTIONNEMENT\n` +
          `Le shield est un **système de protection globale** permettant de sécuriser\n` +
          `l'intégralité du serveur en cas de menace, raid ou incident majeur.\n\n` +

          `## 🔐 ACTIONS APPLIQUÉES\n` +
          `• Attribution automatique des rôles\n` +
          `• Restriction globale des accès\n` +
          `• Surveillance renforcée\n` +
          `• Synchronisation du statut du bot\n\n` +

          `## ⚠️ CONSIGNES IMPORTANTES\n` +
          `Toute utilisation abusive de ce système est strictement interdite.\n` +
          `Les actions sont visibles et traçables.\n\n` +

          `## 🎛️ CONTRÔLES\n` +
          `Utilise les boutons ci-dessous pour gérer l’état du shield.`
        )
        .setFooter({ text: "Système de sécurité — Accès restreint" })
        .setTimestamp();

    const panelButtons = () =>
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("shield_on")
          .setLabel("🟢 ACTIVER LE SHIELD")
          .setStyle(ButtonStyle.Success)
          .setDisabled(shieldStatus),

        new ButtonBuilder()
          .setCustomId("shield_off")
          .setLabel("🔴 DÉSACTIVER LE SHIELD")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(!shieldStatus)
      );

    const panelMessage = await message.channel.send({
      embeds: [panelEmbed()],
      components: [panelButtons()]
    });

    /* ================= INTERACTIONS ================= */

    const collector = panelMessage.createMessageComponentCollector();

    collector.on("collect", async interaction => {
      if (!interaction.member.permissions.has("Administrator")) {
        return interaction.reply({
          content: "❌ Accès refusé.",
          ephemeral: true
        });
      }

      // ACK immédiat
      await interaction.deferUpdate();

      setImmediate(async () => {
        const members = await guild.members.fetch();

        /* ===== ACTIVER ===== */
        if (interaction.customId === "shield_on") {
          shieldStatus = true;

          for (const member of members.values()) {
            try {
              await member.roles.remove(ROLE_NORMAL).catch(() => {});
              await member.roles.add(ROLE_SHIELD).catch(() => {});
            } catch {}
          }

          client.user.setPresence({
            status: "dnd",
            activities: [{ name: "🛡️ SHIELD ACTIF — SÉCURITÉ", type: ActivityType.Watching }]
          });

          const alertChannel = guild.channels.cache.get(ALERT_CHANNEL_ID);
          if (alertChannel) {
            const alertEmbed = new EmbedBuilder()
              .setTitle("🚨 ALERTE MAJEURE — SERVEUR EN ÉTAT CRITIQUE")
              .setColor(0xff0000)
              .setDescription(
                `⚠️ **INCIDENT DE SÉCURITÉ MAJEUR** ⚠️\n\n` +
                `Le serveur est actuellement confronté à une situation **extrêmement critique**.\n\n` +

                `🛡️ Le **shield de sécurité global** a été **ACTIVÉ** afin de protéger\n` +
                `l’ensemble des membres et des infrastructures du serveur.\n\n` +

                `🔒 L'accès au serveur est **fortement restreint**.\n` +
                `Seuls les salons essentiels restent accessibles.\n\n` +

                `👮‍♂️ **L’équipe de modération et d’administration est pleinement mobilisée**\n` +
                `et travaille activement pour résoudre la situation.\n\n` +

                `📢 Merci de **respecter strictement les consignes**, de rester calme\n` +
                `et d’attendre les annonces officielles.\n\n` +

                `Toute tentative de contournement entraînera des sanctions immédiates.`
              )
              .setFooter({ text: "Message officiel du staff" })
              .setTimestamp();

            await alertChannel.send({ embeds: [alertEmbed] });
          }
        }

        /* ===== DÉSACTIVER ===== */
        if (interaction.customId === "shield_off") {
          shieldStatus = false;

          for (const member of members.values()) {
            try {
              await member.roles.remove(ROLE_SHIELD).catch(() => {});
              await member.roles.add(ROLE_NORMAL).catch(() => {});
            } catch {}
          }

          client.user.setPresence({
            status: "online",
            activities: [{ name: "🛡️ Shield désactivé", type: ActivityType.Watching }]
          });
        }

        await panelMessage.edit({
          embeds: [panelEmbed()],
          components: [panelButtons()]
        });
      });
    });

    collector.on("end", () => {
      panelExists = false;
    });
  }
};
