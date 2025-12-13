const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
  PermissionsBitField
} = require("discord.js");

// 🔐 IDS DES MODÉRATEURS (accès auto aux tickets)
const MODERATOR_IDS = [
  "1105601228047654912", //  Diego
  "991295146215882872", // Léo
  "1331951922848075776", // Antoine
  "1158083115781210112", // Fromage
  "1288079091211309179" // Jambon
];

module.exports = {
  name: "ticketpanel",
  description: "Panel de tickets avec menu déroulant",
  adminOnly: true,

  async execute(message) {

    /* ================= PANEL ================= */

    const panelEmbed = new EmbedBuilder()
      .setTitle("🎫 SYSTÈME DE TICKETS — SUPPORT OFFICIEL")
      .setColor(0x5865F2)
      .setDescription(
        "👋 **Bonjour et bienvenue sur le système de tickets du serveur.**\n\n" +
        "Merci de sélectionner **le type de demande correspondant à ta situation** à l’aide du menu ci-dessous.\n\n" +
        "📌 Chaque ticket est **privé** et accessible uniquement par toi et l’équipe de modération.\n" +
        "⚠️ Toute utilisation abusive pourra entraîner des sanctions."
      )
      .setFooter({ text: "Support officiel du serveur" })
      .setTimestamp();

    const panelMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("ticket_type")
        .setPlaceholder("📂 Sélectionne le type de ticket")
        .addOptions([
          {
            label: "Plainte sur un joueur",
            description: "Signaler un comportement ou une infraction",
            value: "complaint",
            emoji: "⚠️"
          },
          {
            label: "Demande média",
            description: "Demande d’autorisation de publication",
            value: "media",
            emoji: "📢"
          },
          {
            label: "Autre demande",
            description: "Toute autre question ou demande",
            value: "other",
            emoji: "📩"
          }
        ])
    );

    const panelMessage = await message.channel.send({
      embeds: [panelEmbed],
      components: [panelMenu]
    });

    /* ================= COLLECTOR PANEL ================= */

    const panelCollector = panelMessage.createMessageComponentCollector();

    panelCollector.on("collect", async interaction => {

      /* ===== MENU TYPE ===== */
      if (!interaction.isStringSelectMenu()) return;
      if (interaction.customId !== "ticket_type") return;

      const { guild, user, values } = interaction;
      const type = values[0];

      const existing = guild.channels.cache.find(
        c => c.name === `ticket-${user.id}`
      );

      if (existing) {
        return interaction.reply({
          content: "❌ Tu as déjà un ticket ouvert.",
          ephemeral: true
        });
      }

      await interaction.deferUpdate();

      /* ================= CRÉATION DU SALON ================= */

      const overwrites = [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionsBitField.Flags.ViewChannel]
        },
        {
          id: user.id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        },
        ...MODERATOR_IDS.map(id => ({
          id,
          allow: [
            PermissionsBitField.Flags.ViewChannel,
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.ReadMessageHistory
          ]
        }))
      ];

      const channel = await guild.channels.create({
        name: `ticket-${user.id}`,
        type: ChannelType.GuildText,
        permissionOverwrites: overwrites
      });

      /* ================= TEXTES DES TICKETS ================= */

      const typeMessages = {

        complaint:
          "👋 **Bonjour et bienvenue dans le système de tickets du serveur.**\n\n" +
          "⚠️ **PLAINTE SUR UN JOUEUR**\n\n" +
          "Merci de fournir **des informations complètes et vérifiables** afin que l’équipe de modération puisse traiter ta plainte correctement.\n\n" +
          "**Merci d’indiquer obligatoirement :**\n" +
          "• Le **pseudo exact** du joueur concerné\n" +
          "• La **date et l’heure** des faits\n" +
          "• Une **description détaillée** de la situation\n" +
          "• Des **preuves** (captures, vidéos, logs, etc.)\n\n" +
          "**Exemple :**\n" +
          "> Joueur : ExempleRP\n" +
          "> Date : 14/03 vers 20h45\n" +
          "> Faits : Insultes répétées en vocal\n" +
          "> Preuve : capture d’écran\n\n" +
          "⛔ Toute plainte abusive ou incomplète pourra être **fermée sans suite**.\n" +
          "Merci pour ta coopération.",

        media:
          "👋 **Bonjour et bienvenue dans le système de tickets du serveur.**\n\n" +
          "📢 **DEMANDE DE PUBLICATION DANS LE SALON MÉDIA**\n\n" +
          "Ce ticket permet de **demander l’autorisation d’envoyer un message** dans le salon **média** du serveur.\n\n" +
          "**Merci d’indiquer clairement :**\n" +
          "• Le **type de contenu** (vidéo, live, image, annonce, etc.)\n" +
          "• Le **lien exact** du contenu à publier\n" +
          "• Une **courte description** du message\n\n" +
          "**Exemple :**\n" +
          "> Contenu : Vidéo YouTube\n" +
          "> Lien : https://youtube.com/...\n" +
          "> Description : Présentation du serveur\n\n" +
          "⚠️ **Aucune publication ne sera faite sans validation du staff.**\n" +
          "Merci de patienter pendant l’analyse de ta demande.",

        other:
          "👋 **Bonjour et bienvenue dans le système de tickets du serveur.**\n\n" +
          "📩 **AUTRE DEMANDE**\n\n" +
          "Ce ticket concerne **toute autre demande** ne correspondant pas aux catégories précédentes.\n\n" +
          "**Merci d’expliquer clairement :**\n" +
          "• Le **sujet de ta demande**\n" +
          "• Le **contexte** si nécessaire\n" +
          "• Toute information utile\n\n" +
          "**Exemple :**\n" +
          "> Je souhaite obtenir des informations concernant...\n\n" +
          "🕒 Un membre du staff te répondra dès que possible.\n" +
          "Merci de ta patience."
      };

      const ticketEmbed = new EmbedBuilder()
        .setTitle("🎫 TICKET OUVERT")
        .setColor(0x00ff99)
        .setDescription(typeMessages[type])
        .setTimestamp();

      const openButtons = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("ticket_close")
          .setLabel("🔒 Fermer")
          .setStyle(ButtonStyle.Danger),

        new ButtonBuilder()
          .setCustomId("ticket_add_user")
          .setLabel("➕ Add User")
          .setStyle(ButtonStyle.Secondary)
      );

      const ticketMessage = await channel.send({
        content: `<@${user.id}>`,
        embeds: [ticketEmbed],
        components: [openButtons]
      });

      /* ================= COLLECTOR TICKET ================= */

      const ticketCollector = ticketMessage.createMessageComponentCollector();

      ticketCollector.on("collect", async i => {

        /* ===== FERMER ===== */
        if (i.isButton() && i.customId === "ticket_close") {

          if (!MODERATOR_IDS.includes(i.user.id)) {
            return i.reply({
              content: "❌ Action réservée à la modération.",
              ephemeral: true
            });
          }

          await i.deferUpdate();

          await channel.permissionOverwrites.edit(user.id, {
            SendMessages: false
          });

          const closedButtons = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("ticket_open")
              .setLabel("🔓 Ouvrir")
              .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
              .setCustomId("ticket_delete")
              .setLabel("🗑️ Supprimer")
              .setStyle(ButtonStyle.Danger)
          );

          await ticketMessage.edit({ components: [closedButtons] });
        }

        /* ===== OUVRIR ===== */
        if (i.isButton() && i.customId === "ticket_open") {

          if (!MODERATOR_IDS.includes(i.user.id)) {
            return i.reply({
              content: "❌ Action réservée à la modération.",
              ephemeral: true
            });
          }

          await i.deferUpdate();

          await channel.permissionOverwrites.edit(user.id, {
            SendMessages: true
          });

          await ticketMessage.edit({ components: [openButtons] });
        }

        /* ===== DELETE ===== */
        if (i.isButton() && i.customId === "ticket_delete") {

          if (!MODERATOR_IDS.includes(i.user.id)) {
            return i.reply({
              content: "❌ Action réservée à la modération.",
              ephemeral: true
            });
          }

          await i.reply("🗑️ Suppression du ticket...");
          setTimeout(() => channel.delete().catch(() => {}), 2000);
        }

        /* ===== ADD USER ===== */
        if (i.isButton() && i.customId === "ticket_add_user") {

          if (!MODERATOR_IDS.includes(i.user.id)) {
            return i.reply({
              content: "❌ Action réservée à la modération.",
              ephemeral: true
            });
          }

          const userMenu = new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder()
              .setCustomId("ticket_add_user_select")
              .setPlaceholder("➕ Ajouter un membre au ticket")
          );

          await i.reply({
            content: "Sélectionne le membre à ajouter :",
            components: [userMenu],
            ephemeral: true
          });
        }

        if (i.isUserSelectMenu() && i.customId === "ticket_add_user_select") {

          const addedUserId = i.values[0];

          await channel.permissionOverwrites.edit(addedUserId, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
          });

          await i.reply({
            content: "✅ Membre ajouté au ticket avec succès.",
            ephemeral: true
          });
        }
      });

      await interaction.followUp({
        content: "✅ Ton ticket a été créé avec succès.",
        ephemeral: true
      });
    });
  }
};
