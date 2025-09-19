const { Events, AuditLogEvent, EmbedBuilder, PermissionsBitField } = require("discord.js");
const fs = require("fs");
const path = require("path");

const CONFIG = path.join(__dirname, "logs_config.json");

// Récupère le salon de logs
async function getLogChannel(guild) {
  if (!fs.existsSync(CONFIG)) return null;
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG, "utf8"));
    const ch = await guild.channels.fetch(cfg.logChannel).catch(() => null);
    return ch && ch.isTextBased() ? ch : null;
  } catch {
    return null;
  }
}

function safe(text, max = 1024) {
  if (!text) return "(vide)";
  return text.length > max ? text.slice(0, max - 3) + "..." : text;
}

module.exports = (client) => {
  console.log("📡 Logger complet chargé.");

  // -----------------------
  // MESSAGES SUPPRIMÉS
  // -----------------------
  client.on(Events.MessageDelete, async (message) => {
    if (!message.guild) return;
    const logChannel = await getLogChannel(message.guild);
    if (!logChannel) return;

    if (message.partial) {
      try { message = await message.fetch(); } catch {}
    }

    const author = message.author ? message.author.tag : "Inconnu";
    const content = message.content || (message.attachments.size ? "[Pièce jointe]" : "(non disponible)");
    const channelRef = `#${message.channel?.name ?? "inconnu"}`;

    const embed = new EmbedBuilder()
      .setTitle("🗑️ Message supprimé")
      .setColor(0xE74C3C)
      .addFields(
        { name: "Auteur", value: safe(author), inline: true },
        { name: "Salon", value: safe(channelRef), inline: true },
        { name: "Contenu", value: safe(content) }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // -----------------------
  // MESSAGES MODIFIÉS
  // -----------------------
  client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    const guild = newMessage.guild ?? oldMessage.guild;
    if (!guild) return;
    const logChannel = await getLogChannel(guild);
    if (!logChannel) return;

    const oldContent = oldMessage?.content ?? "(non disponible)";
    const newContent = newMessage.content ?? "(vide)";
    if (oldContent === newContent) return;

    const author = newMessage.author ? newMessage.author.tag : "Inconnu";
    const channelRef = `#${newMessage.channel?.name ?? "inconnu"}`;

    const embed = new EmbedBuilder()
      .setTitle("✏️ Message modifié")
      .setColor(0xF1C40F)
      .addFields(
        { name: "Auteur", value: safe(author), inline: true },
        { name: "Salon", value: safe(channelRef), inline: true },
        { name: "Avant", value: safe(oldContent) },
        { name: "Après", value: safe(newContent) }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // -----------------------
  // MEMBRE REJOINT
  // -----------------------
  client.on(Events.GuildMemberAdd, async (member) => {
    const logChannel = await getLogChannel(member.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("👋 Nouveau membre")
      .setColor(0x2ECC71)
      .setDescription(`${member.user.tag} a rejoint le serveur.`)
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // -----------------------
  // MEMBRE QUITTE
  // -----------------------
  client.on(Events.GuildMemberRemove, async (member) => {
    const logChannel = await getLogChannel(member.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("🚪 Membre parti")
      .setColor(0xE67E22)
      .setDescription(`${member.user.tag} a quitté le serveur.`)
      .setThumbnail(member.user.displayAvatarURL())
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // -----------------------
  // AJOUT / RETRAIT DE RÔLES SUR UN MEMBRE
  // -----------------------
  client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    const logChannel = await getLogChannel(newMember.guild);
    if (!logChannel) return;

    const oldRoles = oldMember.roles.cache.map(r => r.name);
    const newRoles = newMember.roles.cache.map(r => r.name);

    const added = newRoles.filter(r => !oldRoles.includes(r));
    const removed = oldRoles.filter(r => !newRoles.includes(r));

    if (!added.length && !removed.length) return;

    const embed = new EmbedBuilder()
      .setTitle("🎭 Rôles modifiés sur un membre")
      .setColor(0x3498DB)
      .setDescription(`Utilisateur : ${newMember.user.tag}`)
      .setTimestamp();

    if (added.length) embed.addFields({ name: "Ajoutés", value: safe(added.join(", ")) });
    if (removed.length) embed.addFields({ name: "Retirés", value: safe(removed.join(", ")) });

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // -----------------------
  // VOIX
  // -----------------------
  client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    const guild = newState.guild || oldState.guild;
    if (!guild) return;
    const logChannel = await getLogChannel(guild);
    if (!logChannel) return;

    // Déconnexion vocale
    if (oldState.channelId && !newState.channelId) {
      let executor = "Inconnu";
      try {
        const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberDisconnect, limit: 1 });
        const entry = logs.entries.first();
        if (entry && Date.now() - entry.createdTimestamp < 5000) executor = entry.executor?.tag ?? "Inconnu";
      } catch {}

      const embed = new EmbedBuilder()
        .setTitle("❌ Déconnexion vocale")
        .setColor(0xE74C3C)
        .addFields(
          { name: "Utilisateur", value: oldState.member?.user?.tag ?? "Inconnu", inline: true },
          { name: "Salon", value: oldState.channel?.name ?? "Inconnu", inline: true },
          { name: "Par", value: executor, inline: true }
        )
        .setTimestamp();

      return logChannel.send({ embeds: [embed] }).catch(() => {});
    }

    // Déplacement vocal
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      let executor = "Inconnu";
      try {
        const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberMove, limit: 1 });
        const entry = logs.entries.first();
        if (entry && Date.now() - entry.createdTimestamp < 5000) executor = entry.executor?.tag ?? "Inconnu";
      } catch {}

      const embed = new EmbedBuilder()
        .setTitle("🔄 Déplacement vocal")
        .setColor(0x2980B9)
        .addFields(
          { name: "Utilisateur", value: oldState.member?.user?.tag ?? "Inconnu", inline: true },
          { name: "De", value: oldState.channel?.name ?? "Inconnu", inline: true },
          { name: "Vers", value: newState.channel?.name ?? "Inconnu", inline: true },
          { name: "Par", value: executor, inline: true }
        )
        .setTimestamp();

      return logChannel.send({ embeds: [embed] }).catch(() => {});
    }
  });

  // -----------------------
  // CRÉATION / SUPPRESSION / MODIFICATION DE RÔLES
  // -----------------------
  client.on(Events.GuildRoleCreate, async (role) => {
    const logChannel = await getLogChannel(role.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("➕ Rôle créé")
      .setColor(0x2ECC71)
      .addFields({ name: "Nom", value: role.name, inline: true })
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  client.on(Events.GuildRoleDelete, async (role) => {
    const logChannel = await getLogChannel(role.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("🗑️ Rôle supprimé")
      .setColor(0xE74C3C)
      .addFields({ name: "Nom", value: role.name, inline: true })
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
    const logChannel = await getLogChannel(newRole.guild);
    if (!logChannel) return;

    const fields = [];

    if (oldRole.name !== newRole.name) {
      fields.push({ name: "Nom avant", value: safe(oldRole.name), inline: true });
      fields.push({ name: "Nom après", value: safe(newRole.name), inline: true });
    }

    if (!fields.length) return;

    const embed = new EmbedBuilder()
      .setTitle("⚙️ Rôle modifié")
      .setColor(0xF39C12)
      .addFields(fields)
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // -----------------------
  // CRÉATION / SUPPRESSION / MODIFICATION DE SALONS
  // -----------------------
  client.on(Events.ChannelCreate, async (channel) => {
    const logChannel = await getLogChannel(channel.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("📂 Salon créé")
      .setColor(0x2ECC71)
      .addFields({ name: "Nom", value: channel.name, inline: true })
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  client.on(Events.ChannelDelete, async (channel) => {
    const logChannel = await getLogChannel(channel.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("🗑️ Salon supprimé")
      .setColor(0xE74C3C)
      .addFields({ name: "Nom", value: channel.name, inline: true })
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
    const logChannel = await getLogChannel(newChannel.guild);
    if (!logChannel) return;

    if (oldChannel.name === newChannel.name) return;

    const embed = new EmbedBuilder()
      .setTitle("⚙️ Salon modifié")
      .setColor(0xF39C12)
      .addFields(
        { name: "Nom avant", value: safe(oldChannel.name), inline: true },
        { name: "Nom après", value: safe(newChannel.name), inline: true }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // -----------------------
  // BANS ET UNBANS
  // -----------------------
  client.on(Events.GuildBanAdd, async (ban) => {
    const logChannel = await getLogChannel(ban.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("🔨 Utilisateur banni")
      .setColor(0x8E44AD)
      .addFields({ name: "Utilisateur", value: ban.user.tag, inline: true })
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  client.on(Events.GuildBanRemove, async (ban) => {
    const logChannel = await getLogChannel(ban.guild);
    if (!logChannel) return;

    const embed = new EmbedBuilder()
      .setTitle("✅ Utilisateur débanni")
      .setColor(0x27AE60)
      .addFields({ name: "Utilisateur", value: ban.user.tag, inline: true })
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });
};
