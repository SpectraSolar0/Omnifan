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
  // VOICE STATE UPDATE
  // -----------------------
  client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
    const guild = newState.guild || oldState.guild;
    if (!guild) return;
    const logChannel = await getLogChannel(guild);
    if (!logChannel) return;

    // Déconnexion vocale forcée
    if (oldState.channelId && !newState.channelId) {
      let executor = "Inconnu";
      try {
        const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberMove, limit: 5 });
        const entry = logs.entries.first();
        if (entry && Date.now() - entry.createdTimestamp < 5000) executor = entry.executor?.tag ?? "Inconnu";
      } catch {}

      const embed = new EmbedBuilder()
        .setTitle("❌ Déconnexion vocale forcée")
        .setColor(0xE67E22)
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
        const logs = await guild.fetchAuditLogs({ type: AuditLogEvent.MemberMove, limit: 5 });
        const entry = logs.entries.first();
        if (entry && Date.now() - entry.createdTimestamp < 5000) executor = entry.executor?.tag ?? "Inconnu";
      } catch {}

      const embed = new EmbedBuilder()
        .setTitle("🔄 Déplacement vocal")
        .setColor(0x2980B9)
        .addFields(
          { name: "Utilisateur déplacé", value: oldState.member?.user?.tag ?? "Inconnu", inline: true },
          { name: "De", value: oldState.channel?.name ?? "Inconnu", inline: true },
          { name: "Vers", value: newState.channel?.name ?? "Inconnu", inline: true },
          { name: "Déplacé par", value: executor, inline: true }
        )
        .setTimestamp();

      return logChannel.send({ embeds: [embed] }).catch(() => {});
    }
  });

  // -----------------------
  // ROLES
  // -----------------------
  client.on(Events.GuildRoleCreate, async (role) => {
    const logChannel = await getLogChannel(role.guild);
    if (!logChannel) return;

    let executor = "Inconnu";
    try {
      const logs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleCreate, limit: 1 });
      const entry = logs.entries.first();
      if (entry && Date.now() - entry.createdTimestamp < 5000) executor = entry.executor?.tag ?? "Inconnu";
    } catch {}

    const perms = new PermissionsBitField(role.permissions).toArray().join(", ");
    const embed = new EmbedBuilder()
      .setTitle("➕ Rôle créé")
      .setColor(0x2ECC71)
      .addFields(
        { name: "Nom", value: role.name, inline: true },
        { name: "Créé par", value: executor, inline: true },
        { name: "Permissions", value: safe(perms) }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
    const logChannel = await getLogChannel(newRole.guild);
    if (!logChannel) return;

    let executor = "Inconnu";
    try {
      const logs = await newRole.guild.fetchAuditLogs({ type: AuditLogEvent.RoleUpdate, limit: 1 });
      const entry = logs.entries.first();
      if (entry && Date.now() - entry.createdTimestamp < 5000) executor = entry.executor?.tag ?? "Inconnu";
    } catch {}

    const fields = [{ name: "Modifié par", value: executor, inline: true }];

    // Nom modifié
    if (oldRole.name !== newRole.name) {
      fields.push({ name: "Nom avant", value: safe(oldRole.name), inline: true });
      fields.push({ name: "Nom après", value: safe(newRole.name), inline: true });
    }

    // Permissions modifiées
    const oldPerms = new PermissionsBitField(oldRole.permissions);
    const newPerms = new PermissionsBitField(newRole.permissions);

    const added = new PermissionsBitField(newPerms.bitfield & ~oldPerms.bitfield).toArray();
    const removed = new PermissionsBitField(oldPerms.bitfield & ~newPerms.bitfield).toArray();

    if (added.length) fields.push({ name: "Permissions activées", value: safe(added.join(", ")) });
    if (removed.length) fields.push({ name: "Permissions désactivées", value: safe(removed.join(", ")) });

    if (fields.length === 1) return;

    const embed = new EmbedBuilder()
      .setTitle("⚙️ Rôle modifié")
      .setColor(0xF39C12)
      .addFields(fields)
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  client.on(Events.GuildRoleDelete, async (role) => {
    const logChannel = await getLogChannel(role.guild);
    if (!logChannel) return;

    let executor = "Inconnu";
    try {
      const logs = await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 });
      const entry = logs.entries.first();
      if (entry && Date.now() - entry.createdTimestamp < 5000) executor = entry.executor?.tag ?? "Inconnu";
    } catch {}

    const perms = new PermissionsBitField(role.permissions).toArray().join(", ");
    const embed = new EmbedBuilder()
      .setTitle("🗑️ Rôle supprimé")
      .setColor(0xE74C3C)
      .addFields(
        { name: "Nom", value: role.name, inline: true },
        { name: "Supprimé par", value: executor, inline: true },
        { name: "Permissions", value: safe(perms) }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // -----------------------
  // SALONS
  // -----------------------
  client.on(Events.ChannelCreate, async (channel) => {
    if (!channel.guild) return;
    const logChannel = await getLogChannel(channel.guild);
    if (!logChannel) return;

    let who = "Inconnu";
    try {
      const logs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate, limit: 1 });
      const entry = logs.entries.first();
      if (entry && Date.now() - entry.createdTimestamp < 5000) who = entry.executor?.tag ?? "Inconnu";
    } catch {}

    const embed = new EmbedBuilder()
      .setTitle("📂 Salon créé")
      .setColor(0x2ECC71)
      .addFields(
        { name: "Nom", value: channel.name || "Inconnu", inline: true },
        { name: "Créé par", value: who, inline: true }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  client.on(Events.ChannelDelete, async (channel) => {
    if (!channel.guild) return;
    const logChannel = await getLogChannel(channel.guild);
    if (!logChannel) return;

    let who = "Inconnu";
    try {
      const logs = await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 });
      const entry = logs.entries.first();
      if (entry && Date.now() - entry.createdTimestamp < 5000) who = entry.executor?.tag ?? "Inconnu";
    } catch {}

    const embed = new EmbedBuilder()
      .setTitle("🗑️ Salon supprimé")
      .setColor(0xE74C3C)
      .addFields(
        { name: "Nom", value: channel.name || "Inconnu", inline: true },
        { name: "Supprimé par", value: who, inline: true }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // -----------------------
  // BANS
  // -----------------------
  client.on(Events.GuildBanAdd, async (ban) => {
    const logChannel = await getLogChannel(ban.guild);
    if (!logChannel) return;

    let who = "Inconnu";
    try {
      const logs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
      const entry = logs.entries.first();
      if (entry && Date.now() - entry.createdTimestamp < 5000) who = entry.executor?.tag ?? "Inconnu";
    } catch {}

    const embed = new EmbedBuilder()
      .setTitle("🔨 Utilisateur banni")
      .setColor(0x8E44AD)
      .addFields(
        { name: "Utilisateur", value: ban.user.tag, inline: true },
        { name: "Par", value: who, inline: true }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  client.on(Events.GuildBanRemove, async (ban) => {
    const logChannel = await getLogChannel(ban.guild);
    if (!logChannel) return;

    let who = "Inconnu";
    try {
      const logs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 1 });
      const entry = logs.entries.first();
      if (entry && Date.now() - entry.createdTimestamp < 5000) who = entry.executor?.tag ?? "Inconnu";
    } catch {}

    const embed = new EmbedBuilder()
      .setTitle("✅ Utilisateur unbanni")
      .setColor(0x27AE60)
      .addFields(
        { name: "Utilisateur", value: ban.user.tag, inline: true },
        { name: "Par", value: who, inline: true }
      )
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });

  // -----------------------
  // SALONS MODIFIÉS
  // -----------------------
  client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
    if (!oldChannel.guild) return;
    const logChannel = await getLogChannel(oldChannel.guild);
    if (!logChannel) return;

    let executor = "Inconnu";
    try {
      const logs = await oldChannel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelUpdate, limit: 1 });
      const entry = logs.entries.first();
      if (entry && Date.now() - entry.createdTimestamp < 5000) executor = entry.executor?.tag ?? "Inconnu";
    } catch {}

    const fields = [{ name: "Modifié par", value: executor, inline: true }];

    // Comparer le nom
    if (oldChannel.name !== newChannel.name) {
      fields.push({ name: "Nom avant", value: safe(oldChannel.name), inline: true });
      fields.push({ name: "Nom après", value: safe(newChannel.name), inline: true });
    }

    // Comparer le type
    if (oldChannel.type !== newChannel.type) {
      fields.push({ name: "Type avant", value: oldChannel.type, inline: true });
      fields.push({ name: "Type après", value: newChannel.type, inline: true });
    }

    // Comparer les permissions pour chaque overwrite
    const oldPerms = oldChannel.permissionOverwrites.cache;
    const newPerms = newChannel.permissionOverwrites.cache;

    oldPerms.forEach((oldOverwrite, id) => {
      const newOverwrite = newPerms.get(id);
      if (!newOverwrite) return;
      const oldAllow = new PermissionsBitField(oldOverwrite.allow).toArray();
      const newAllow = new PermissionsBitField(newOverwrite.allow).toArray();
      const oldDeny = new PermissionsBitField(oldOverwrite.deny).toArray();
      const newDeny = new PermissionsBitField(newOverwrite.deny).toArray();

      const added = newAllow.filter(p => !oldAllow.includes(p));
      const removed = oldAllow.filter(p => !newAllow.includes(p));
      const deniedAdded = newDeny.filter(p => !oldDeny.includes(p));
      const deniedRemoved = oldDeny.filter(p => !newDeny.includes(p));

      if (added.length) fields.push({ name: `Permissions activées pour <@&${id}>`, value: safe(added.join(", ")) });
      if (removed.length) fields.push({ name: `Permissions désactivées pour <@&${id}>`, value: safe(removed.join(", ")) });
      if (deniedAdded.length) fields.push({ name: `Permissions refusées pour <@&${id}>`, value: safe(deniedAdded.join(", ")) });
      if (deniedRemoved.length) fields.push({ name: `Permissions retirées pour <@&${id}>`, value: safe(deniedRemoved.join(", ")) });
    });

    if (fields.length === 1) return; // rien n’a changé

    const embed = new EmbedBuilder()
      .setTitle("⚙️ Salon modifié")
      .setColor(0xF39C12)
      .addFields(fields)
      .setTimestamp();

    logChannel.send({ embeds: [embed] }).catch(() => {});
  });
};
