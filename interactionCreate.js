const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  UserSelectMenuBuilder,
  ChannelType,
  EmbedBuilder
} = require("discord.js");

/* ======================
   CONFIG
====================== */

const STAFF_ROLES = [
  "1416853443670179881",
  "1416853356307283968",
  "1416853288896172073"
];

const ticketTimers = new Map();

/* ======================
   BOUTONS
====================== */

const OPEN_BUTTONS = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("close_ticket")
    .setLabel("🔒 Fermer le ticket")
    .setStyle(ButtonStyle.Danger),
  new ButtonBuilder()
    .setCustomId("add_user")
    .setLabel("➕ Ajouter un utilisateur")
    .setStyle(ButtonStyle.Primary)
);

const CLOSED_BUTTONS = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId("open_ticket")
    .setLabel("🔓 Ouvrir le ticket")
    .setStyle(ButtonStyle.Success),
  new ButtonBuilder()
    .setCustomId("delete_ticket")
    .setLabel("🗑️ Supprimer le ticket")
    .setStyle(ButtonStyle.Danger)
);

/* ======================
   INACTIVITÉ
====================== */

function resetInactivityTimer(channel) {
  if (ticketTimers.has(channel.id)) {
    clearTimeout(ticketTimers.get(channel.id));
  }

  const warnTimeout = setTimeout(async () => {
    const warnEmbed = new EmbedBuilder()
      .setColor(0xffa500)
      .setTitle("⏰ Inactivité détectée")
      .setDescription(
        "Aucun message depuis **1 heure**.\n\n" +
        "⚠️ Sans réponse, ce ticket sera **supprimé automatiquement dans 24 heures**."
      );

    await channel.send({ embeds: [warnEmbed] });

    const deleteTimeout = setTimeout(() => {
      channel.delete().catch(() => {});
    }, 24 * 60 * 60 * 1000);

    ticketTimers.set(channel.id, deleteTimeout);
  }, 60 * 60 * 1000);

  ticketTimers.set(channel.id, warnTimeout);
}

/* ======================
   INTERACTIONS
====================== */

module.exports = async (interaction) => {

  /* ===== MENU TICKET ===== */
  if (interaction.isStringSelectMenu()) {
    if (interaction.customId !== "ticket_type") return;

    const guild = interaction.guild;
    const user = interaction.user;

    const existing = guild.channels.cache.find(
      c => c.topic === `ticketOwner:${user.id}`
    );

    if (existing) {
      return interaction.reply({
        content: `❌ Tu as déjà un ticket ouvert : ${existing}`,
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
        { id: guild.roles.everyone.id, deny: ["ViewChannel"] },
        { id: user.id, allow: ["ViewChannel", "SendMessages"] },
        ...STAFF_ROLES.map(r => ({
          id: r,
          allow: ["ViewChannel", "SendMessages"]
        }))
      ]
    });

    const introEmbeds = {
      plainte: new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle("⚖️ Ticket — Plainte")
        .setDescription(
          "Merci de fournir :\n\n" +
          "• Nom du joueur\n" +
          "• Date et heure\n" +
          "• Description détaillée\n" +
          "• Preuves (screens / vidéos)\n\n" +
          "_Un membre du staff prendra ta plainte en charge._"
        ),

      media: new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle("📢 Ticket — Demande média")
        .setDescription(
          "Merci d’indiquer :\n\n" +
          "• Message exact à publier\n" +
          "• Salon concerné\n" +
          "• Contexte\n\n" +
          "_La demande sera validée par le staff._"
        ),

      autre: new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle("❓ Ticket — Autre demande")
        .setDescription(
          "Explique clairement ta demande.\n\n" +
          "_Plus tu es précis, plus la réponse sera rapide._"
        )
    };

    await channel.send({
      embeds: [introEmbeds[type] || introEmbeds.autre],
      components: [OPEN_BUTTONS]
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

    const channel = interaction.channel;
    const ownerId = channel.topic?.split(":")[1];

    // 🔒 FERMER
    if (interaction.customId === "close_ticket") {
      if (ownerId) {
        await channel.permissionOverwrites.edit(ownerId, {
          SendMessages: false
        });
      }

      const closeEmbed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle("🔒 Ticket fermé")
        .setDescription(
          "Le membre peut toujours voir le salon,\n" +
          "mais **ne peut plus envoyer de messages**."
        );

      await interaction.message.edit({
        components: [CLOSED_BUTTONS]
      });

      return interaction.reply({
        embeds: [closeEmbed],
        ephemeral: true
      });
    }

    // 🔓 OUVRIR
    if (interaction.customId === "open_ticket") {
      if (ownerId) {
        await channel.permissionOverwrites.edit(ownerId, {
          SendMessages: true
        });
      }

      const openEmbed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle("🔓 Ticket rouvert")
        .setDescription("Le membre peut à nouveau envoyer des messages.");

      await interaction.message.edit({
        components: [OPEN_BUTTONS]
      });

      return interaction.reply({
        embeds: [openEmbed],
        ephemeral: true
      });
    }

    // 🗑️ SUPPRIMER
    if (interaction.customId === "delete_ticket") {
      await channel.delete().catch(() => {});
    }

    // ➕ AJOUTER UTILISATEUR
    if (interaction.customId === "add_user") {
      const menu = new UserSelectMenuBuilder()
        .setCustomId("add_user_select")
        .setMinValues(1)
        .setMaxValues(1);

      return interaction.reply({
        components: [new ActionRowBuilder().addComponents(menu)],
        ephemeral: true
      });
    }
  }

  /* ===== AJOUT UTILISATEUR ===== */
  if (interaction.isUserSelectMenu()) {
    if (interaction.customId !== "add_user_select") return;

    const userId = interaction.values[0];

    await interaction.channel.permissionOverwrites.edit(userId, {
      ViewChannel: true,
      SendMessages: true
    });

    return interaction.reply({
      content: "✅ Utilisateur ajouté au ticket.",
      ephemeral: true
    });
  }
};
