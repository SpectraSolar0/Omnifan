const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionsBitField
} = require("discord.js");

module.exports = {
  name: "ticket",
  description: "Système de tickets avec menu déroulant",
  adminOnly: false,
  moderatorOnly: false,
  ownerOnly: false,

  async execute(message) {
    const guild = message.guild;

    /* ================= EMBED PANEL ================= */

    const panelEmbed = new EmbedBuilder()
      .setTitle("🎫 SYSTÈME DE TICKETS — SUPPORT OFFICIEL")
      .setColor(0x5865f2)
      .setDescription(
        `**Bonjour et bienvenue sur le support du serveur !** 👋\n\n` +

        `Merci d’utiliser notre **système de tickets**.\n` +
        `Ce système permet de contacter le staff de manière **privée, sécurisée et organisée**.\n\n` +

        `### 📌 Merci de choisir le type de ticket correspondant à votre demande :\n` +
        `• 🧑‍⚖️ **Plainte contre un joueur**\n` +
        `• 📢 **Demande média (publication officielle)**\n` +
        `• ❓ **Autre demande**\n\n` +

        `Un membre du staff vous répondra dès que possible.\n` +
        `Merci de rester respectueux et précis dans votre demande.`
      )
      .setFooter({ text: "Support du serveur — Merci de votre patience" });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("ticket_type")
      .setPlaceholder("📂 Sélectionnez le type de ticket")
      .addOptions(
        {
          label: "Plainte contre un joueur",
          value: "plainte",
          description: "Signaler un comportement ou un joueur",
          emoji: "⚖️"
        },
        {
          label: "Demande média",
          value: "media",
          description: "Demander l'envoi d'un message dans le salon média",
          emoji: "📢"
        },
        {
          label: "Autre demande",
          value: "autre",
          description: "Toute autre demande ou question",
          emoji: "❓"
        }
      );

    const panelMessage = await message.channel.send({
      embeds: [panelEmbed],
      components: [new ActionRowBuilder().addComponents(selectMenu)]
    });

    /* ================= COLLECTOR ================= */

    const collector = panelMessage.createMessageComponentCollector();

    collector.on("collect", async interaction => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: "❌ Ce menu ne t’est pas destiné.",
          ephemeral: true
        });
      }

      await interaction.deferUpdate();

      const type = interaction.values[0];
      const channelName = `ticket-${type}-${interaction.user.username}`;

      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: 0,
        permissionOverwrites: [
          { id: guild.roles.everyone.id, deny: ["ViewChannel"] },
          { id: interaction.user.id, allow: ["ViewChannel", "SendMessages"] },
          {
            id: guild.roles.cache.find(r =>
              r.permissions.has(PermissionsBitField.Flags.ModerateMembers)
            )?.id,
            allow: ["ViewChannel", "SendMessages"]
          }
        ]
      });

      /* ================= MESSAGE TICKET ================= */

      let ticketText = "";

      if (type === "plainte") {
        ticketText =
          `👋 **Bonjour ${interaction.user}**, bienvenue dans ton ticket de **plainte**.\n\n` +
          `Merci de **décrire précisément la situation** :\n` +
          `• Nom du joueur concerné\n` +
          `• Date et heure\n` +
          `• Preuves (screens, vidéos)\n\n` +
          `Un modérateur prendra en charge ta demande.`;
      }

      if (type === "media") {
        ticketText =
          `👋 **Bonjour ${interaction.user}**, bienvenue dans ton ticket **demande média**.\n\n` +
          `Merci d’indiquer **le message exact** que tu souhaites voir publié\n` +
          `dans le salon **📢 média officiel**.\n\n` +
          `Le staff vérifiera et validera ta demande.`;
      }

      if (type === "autre") {
        ticketText =
          `👋 **Bonjour ${interaction.user}**, bienvenue dans ton ticket.\n\n` +
          `Merci d’expliquer clairement ta demande.\n` +
          `Un membre du staff te répondra rapidement.`;
      }

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

      /* ================= BUTTON COLLECTOR ================= */

      const buttonCollector =
        ticketMsg.createMessageComponentCollector();

      buttonCollector.on("collect", async btn => {
        if (
          !btn.member.permissions.has(
            PermissionsBitField.Flags.ModerateMembers
          )
        ) {
          return btn.reply({
            content: "❌ Réservé à la modération.",
            ephemeral: true
          });
        }

        await btn.deferUpdate();

        // FERMER
        if (btn.customId === "close_ticket") {
          await ticketChannel.permissionOverwrites.edit(
            interaction.user.id,
            { SendMessages: false }
          );

          const buttonsClosed = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("open_ticket")
              .setLabel("🔓 Ouvrir")
              .setStyle(ButtonStyle.Success),

            new ButtonBuilder()
              .setCustomId("delete_ticket")
              .setLabel("🗑️ Supprimer")
              .setStyle(ButtonStyle.Danger)
          );

          await ticketMsg.edit({ components: [buttonsClosed] });
        }

        // OUVRIR
        if (btn.customId === "open_ticket") {
          await ticketChannel.permissionOverwrites.edit(
            interaction.user.id,
            { SendMessages: true }
          );

          await ticketMsg.edit({ components: [buttonsOpen] });
        }

        // DELETE
        if (btn.customId === "delete_ticket") {
          await ticketChannel.delete();
        }
      });
    });
  }
};
