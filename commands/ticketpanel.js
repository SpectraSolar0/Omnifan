const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  UserSelectMenuBuilder,
  PermissionsBitField,
  ChannelType
} = require("discord.js");

/* ===== CONFIG ===== */
const PANEL_CHANNEL_ID = "1417933039761363128";

/* RÔLES STAFF (moderatorOnly) */
const STAFF_ROLES = [
  "1331951922848075776",
  "991295146215882872",
  "1105601228047654912"
];

module.exports = {
  name: "ticket",
  description: "Panneau de tickets (auto reset)",
  adminOnly: false,
  moderatorOnly: true,
  ownerOnly: false,

  async execute(message) {
    const guild = message.guild;

    /* ===== SALON PANEL ===== */
    const panelChannel = await guild.channels.fetch(PANEL_CHANNEL_ID);

    /* ===== SUPPRESSION DES ANCIENS PANELS ===== */
    const messages = await panelChannel.messages.fetch({ limit: 20 });

    const oldPanels = messages.filter(
      m =>
        m.author.id === message.client.user.id &&
        m.components.length > 0
    );

    for (const msg of oldPanels.values()) {
      await msg.delete().catch(() => {});
    }

    /* ===== EMBED PANEL ===== */
    const panelEmbed = new EmbedBuilder()
      .setTitle("🎫 SYSTÈME DE TICKETS — SUPPORT OFFICIEL")
      .setColor(0x5865f2)
      .setDescription(
        `**Bienvenue sur le support du serveur** 👋\n\n` +
        `Merci de choisir le type de ticket correspondant à ta demande :\n\n` +
        `• ⚖️ Plainte contre un joueur\n` +
        `• 📢 Demande média\n` +
        `• ❓ Autre demande\n\n` +
        `Un membre du staff te répondra rapidement.`
      )
      .setFooter({ text: "Support du serveur" });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("ticket_type")
      .setPlaceholder("📂 Sélectionne un type de ticket")
      .addOptions(
        {
          label: "Plainte contre un joueur",
          value: "plainte",
          emoji: "⚖️"
        },
        {
          label: "Demande média",
          value: "media",
          emoji: "📢"
        },
        {
          label: "Autre demande",
          value: "autre",
          emoji: "❓"
        }
      );

    const panelMessage = await panelChannel.send({
      embeds: [panelEmbed],
      components: [new ActionRowBuilder().addComponents(selectMenu)]
    });

    /* ===== COLLECTOR MENU ===== */
    const collector =
      panelMessage.createMessageComponentCollector();

    collector.on("collect", async interaction => {
      if (!interaction.isStringSelectMenu()) return;

      await interaction.deferReply({ ephemeral: true });

      const type = interaction.values[0];
      const channelName = `ticket-${type}-${interaction.user.username}`;

      /* ===== CRÉATION DU TICKET ===== */
      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: guild.roles.everyone.id,
            deny: ["ViewChannel"]
          },
          {
            id: interaction.user.id,
            allow: ["ViewChannel", "SendMessages"]
          },
          ...STAFF_ROLES.map(roleId => ({
            id: roleId,
            allow: ["ViewChannel", "SendMessages"]
          }))
        ]
      });

      /* ===== TEXTE DU TICKET ===== */
      let ticketText = {
        plainte:
          `👋 **Bonjour ${interaction.user}**,\n\n` +
          `Merci de décrire précisément la plainte :\n` +
          `• Joueur concerné\n• Date & heure\n• Preuves`,
        media:
          `👋 **Bonjour ${interaction.user}**,\n\n` +
          `Merci d’indiquer le message à publier dans le salon média.`,
        autre:
          `👋 **Bonjour ${interaction.user}**,\n\n` +
          `Explique clairement ta demande.`
      }[type];

      const buttonsOpen = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("close_ticket")
          .setLabel("🔒 Fermer")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("add_user")
          .setLabel("➕ Ajouter un utilisateur")
          .setStyle(ButtonStyle.Primary)
      );

      const ticketMsg = await ticketChannel.send({
        content: ticketText,
        components: [buttonsOpen]
      });

      await interaction.editReply({
        content: `✅ Ton ticket a été créé : ${ticketChannel}`
      });

      /* ===== COLLECTOR BOUTONS ===== */
      const buttonCollector =
        ticketMsg.createMessageComponentCollector();

      buttonCollector.on("collect", async btn => {
        if (
          !btn.member.roles.cache.some(r =>
            STAFF_ROLES.includes(r.id)
          )
        ) {
          return btn.reply({
            content: "❌ Réservé à la modération.",
            ephemeral: true
          });
        }

        await btn.deferUpdate();

        /* ➕ AJOUTER UTILISATEUR */
        if (btn.customId === "add_user") {
          const userSelect = new UserSelectMenuBuilder()
            .setCustomId("add_user_select")
            .setPlaceholder("👤 Choisir un membre")
            .setMinValues(1)
            .setMaxValues(1);

          const row =
            new ActionRowBuilder().addComponents(userSelect);

          const selectMessage =
            await ticketChannel.send({
              content:
                "👮 Sélectionnez un membre à ajouter au ticket.",
              components: [row]
            });

          const selectCollector =
            selectMessage.createMessageComponentCollector({
              max: 1
            });

          selectCollector.on("collect", async select => {
            const userId = select.values[0];

            await ticketChannel.permissionOverwrites.edit(
              userId,
              {
                ViewChannel: true,
                SendMessages: true
              }
            );

            await select.update({
              content:
                "✅ Membre ajouté au ticket avec succès.",
              components: []
            });

            setTimeout(() => {
              selectMessage.delete().catch(() => {});
            }, 3000);
          });
        }

        /* 🔒 FERMER */
        if (btn.customId === "close_ticket") {
          await ticketChannel.permissionOverwrites.edit(
            interaction.user.id,
            { SendMessages: false }
          );

          const buttonsClosed =
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("open_ticket")
                .setLabel("🔓 Ouvrir")
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId("delete_ticket")
                .setLabel("🗑️ Supprimer")
                .setStyle(ButtonStyle.Danger)
            );

          await ticketMsg.edit({
            components: [buttonsClosed]
          });
        }

        /* 🔓 OUVRIR */
        if (btn.customId === "open_ticket") {
          await ticketChannel.permissionOverwrites.edit(
            interaction.user.id,
            { SendMessages: true }
          );

          await ticketMsg.edit({
            components: [buttonsOpen]
          });
        }

        /* 🗑️ SUPPRIMER */
        if (btn.customId === "delete_ticket") {
          await ticketChannel.delete();
        }
      });
    });

    await message.reply(
      "✅ Panel de ticket recréé avec succès."
    );
  }
};
