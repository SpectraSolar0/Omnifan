const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  UserSelectMenuBuilder,
  ChannelType
} = require("discord.js");

/* ===== CONFIG ===== */
const STAFF_ROLES = [
  "1416853443670179881",
  "1416853356307283968",
  "1416853288896172073"
];

const ticketTimers = new Map(); // channelId => timeout

/* ===== FONCTIONS ===== */
function resetInactivityTimer(channel) {
  if (ticketTimers.has(channel.id)) {
    clearTimeout(ticketTimers.get(channel.id));
  }

  // ⏳ 1 heure
  const warnTimeout = setTimeout(async () => {
    await channel.send(
      "⏰ **Inactivité détectée**\n\n" +
      "Aucune activité n’a été détectée depuis **1 heure**.\n" +
      "Sans réponse, ce ticket sera **supprimé automatiquement dans 24 heures**."
    );

    // 🗑️ 24 heures après l’avertissement
    const deleteTimeout = setTimeout(() => {
      channel.delete().catch(() => {});
    }, 24 * 60 * 60 * 1000);

    ticketTimers.set(channel.id, deleteTimeout);
  }, 60 * 60 * 1000);

  ticketTimers.set(channel.id, warnTimeout);
}

module.exports = {
  name: "interactionCreate",

  async execute(interaction) {
    /* ===== MENU TICKET ===== */
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId !== "ticket_type") return;

      const guild = interaction.guild;
      const user = interaction.user;

      // ❌ 1 ticket max
      const existing = guild.channels.cache.find(
        c => c.topic === `ticketOwner:${user.id}`
      );

      if (existing) {
        return interaction.reply({
          content:
            "❌ Tu as déjà un ticket ouvert : " +
            `${existing}`,
          ephemeral: true
        });
      }

      await interaction.deferReply({ ephemeral: true });

      const type = interaction.values[0];

      const channel = await guild.channels.create({
        name: `ticket-${type}-${user.username}`,
        type: ChannelType.GuildText,
        topic: `ticketOwner:${user.id}`,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: ["ViewChannel"]
          },
          {
            id: user.id,
            allow: ["ViewChannel", "SendMessages"]
          },
          ...STAFF_ROLES.map(r => ({
            id: r,
            allow: ["ViewChannel", "SendMessages"]
          }))
        ]
      });

      const introMessages = {
        plainte:
          "⚖️ **Ticket — Plainte contre un joueur**\n\n" +
          "Merci de fournir les informations suivantes :\n" +
          "• Nom du joueur\n• Date et heure\n• Description précise\n• Preuves si possible\n\n" +
          "_Un membre du staff analysera ta plainte._",

        media:
          "📢 **Ticket — Demande média**\n\n" +
          "Merci d’indiquer :\n" +
          "• Le message exact à publier\n• Le salon concerné\n• Le contexte si nécessaire\n\n" +
          "_Le staff validera avant publication._",

        autre:
          "❓ **Ticket — Autre demande**\n\n" +
          "Explique clairement ta demande.\n" +
          "Plus tu es précis, plus la réponse sera rapide."
      };

      const buttons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("🔒 Fermer le ticket")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("add_user")
          .setLabel("➕ Ajouter un utilisateur")
          .setStyle(ButtonStyle.Primary)
      );

      await channel.send({
        content: introMessages[type],
        components: [buttons]
      });

      resetInactivityTimer(channel);

      return interaction.editReply({
        content: `✅ Ton ticket a été créé : ${channel}`
      });
    }

    /* ===== BOUTONS ===== */
    if (interaction.isButton()) {
      if (
        !interaction.member.roles.cache.some(r =>
          STAFF_ROLES.includes(r.id)
        )
      ) {
        return interaction.reply({
          content: "❌ Réservé au staff.",
          ephemeral: true
        });
      }

      if (interaction.customId === "close_ticket") {
        await interaction.channel.delete().catch(() => {});
      }

      if (interaction.customId === "add_user") {
        const menu = new UserSelectMenuBuilder()
          .setCustomId("add_user_select")
          .setMinValues(1)
          .setMaxValues(1);

        return interaction.reply({
          components: [
            new ActionRowBuilder().addComponents(menu)
          ],
          ephemeral: true
        });
      }
    }

    /* ===== AJOUT UTILISATEUR ===== */
    if (interaction.isUserSelectMenu()) {
      if (interaction.customId !== "add_user_select") return;

      const userId = interaction.values[0];

      await interaction.channel.permissionOverwrites.edit(
        userId,
        {
          ViewChannel: true,
          SendMessages: true
        }
      );

      return interaction.reply({
        content: "✅ Utilisateur ajouté au ticket.",
        ephemeral: true
      });
    }
  }
};
