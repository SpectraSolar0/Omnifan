const { Events, AuditLogEvent, EmbedBuilder } = require("discord.js");

const FOOTER = { text: "Logger • discord.js" };

const COLORS = {
  red: 0xe74c3c,
  green: 0x2ecc71,
  orange: 0xe67e22,
  yellow: 0xf1c40f,
  blue: 0x3498db,
  darkBlue: 0x2980b9,
  purple: 0x8e44ad,
};

// ======================
// HELPERS
// ======================
function safe(text, max = 1024) {
  if (!text) return "(vide)";
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

async function getChannel(guild, config, type) {
  const channelId = config[type] ?? config.default;
  if (!channelId) return null;

  const channel = await guild.channels.fetch(channelId).catch(() => null);
  return channel?.isTextBased() ? channel : null;
}

async function sendLog(guild, config, type, embed) {
  const channel = await getChannel(guild, config, type);
  if (!channel) return;

  embed.setTimestamp().setFooter(FOOTER);
  channel.send({ embeds: [embed] }).catch(console.error);
}

async function getExecutor(guild, type) {
  try {
    const logs = await guild.fetchAuditLogs({ type, limit: 1 });
    const entry = logs.entries.first();
    if (entry && Date.now() - entry.createdTimestamp < 5000) {
      return entry.executor?.tag ?? "Inconnu";
    }
  } catch {}
  return "Inconnu";
}

// ======================
// LOGGER
// ======================
module.exports = (client, LOGS_CONFIG) => {
  console.log("📡 Logger multi-salons prêt.");

  // ======================
  // MESSAGES
  // ======================
  client.on(Events.MessageDelete, async (message) => {
    if (!message.guild) return;
    if (message.partial) {
      try { message = await message.fetch(); } catch { return; }
    }

    sendLog(
      message.guild,
      LOGS_CONFIG,
      "messages",
      new EmbedBuilder()
        .setTitle("🗑️ Message supprimé")
        .setColor(COLORS.red)
        .addFields(
          { name: "Auteur", value: safe(message.author?.tag), inline: true },
          { name: "Salon", value: `<#${message.channel.id}>`, inline: true },
          { name: "Contenu", value: safe(message.content) }
        )
        .setThumbnail(message.author?.displayAvatarURL())
    );
  });

  client.on(Events.MessageUpdate, (oldM, newM) => {
    if (!newM.guild) return;
    if (oldM.content === newM.content) return;

    sendLog(
      newM.guild,
      LOGS_CONFIG,
      "messages",
      new EmbedBuilder()
        .setTitle("✏️ Message modifié")
        .setColor(COLORS.yellow)
        .addFields(
          { name: "Auteur", value: safe(newM.author?.tag), inline: true },
          { name: "Salon", value: `<#${newM.channel.id}>`, inline: true },
          { name: "Avant", value: safe(oldM.content) },
          { name: "Après", value: safe(newM.content) }
        )
        .setThumbnail(newM.author?.displayAvatarURL())
    );
  });

  // ======================
  // MEMBRES
  // ======================
  client.on(Events.GuildMemberAdd, (member) =>
    sendLog(
      member.guild,
      LOGS_CONFIG,
      "members",
      new EmbedBuilder()
        .setTitle("👋 Nouveau membre")
        .setColor(COLORS.green)
        .setDescription(member.user.tag)
        .setThumbnail(member.user.displayAvatarURL())
    )
  );

  client.on(Events.GuildMemberRemove, (member) =>
    sendLog(
      member.guild,
      LOGS_CONFIG,
      "members",
      new EmbedBuilder()
        .setTitle("🚪 Membre parti")
        .setColor(COLORS.orange)
        .setDescription(member.user.tag)
        .setThumbnail(member.user.displayAvatarURL())
    )
  );

  // ======================
  // RÔLES
  // ======================
  client.on(Events.GuildMemberUpdate, (oldM, newM) => {
    const added = newM.roles.cache.filter(r => !oldM.roles.cache.has(r.id) && r.id !== newM.guild.id);
    const removed = oldM.roles.cache.filter(r => !newM.roles.cache.has(r.id) && r.id !== newM.guild.id);
    if (!added.size && !removed.size) return;

    const embed = new EmbedBuilder()
      .setTitle("🎭 Rôles modifiés")
      .setColor(COLORS.blue)
      .setDescription(`Utilisateur : **${newM.user.tag}**`)
      .setThumbnail(newM.user.displayAvatarURL());

    if (added.size) embed.addFields({ name: "Ajoutés", value: added.map(r => r.name).join(", ") });
    if (removed.size) embed.addFields({ name: "Retirés", value: removed.map(r => r.name).join(", ") });

    sendLog(newM.guild, LOGS_CONFIG, "roles", embed);
  });

// ======================
// VOCAL
// ======================
client.on(Events.VoiceStateUpdate, async (oldS, newS) => {
  const guild = newS.guild ?? oldS.guild;
  if (!guild) return;

  const member = newS.member ?? oldS.member;

  // 🔊 Connexion vocale
  if (!oldS.channelId && newS.channelId) {
    return sendLog(
      guild,
      LOGS_CONFIG,
      "voice",
      new EmbedBuilder()
        .setTitle("🔊 Connexion vocale")
        .setColor(COLORS.green)
        .setDescription(`${member.user.tag} → ${newS.channel.name}`)
    );
  }

  // 🔀 Déplacement vocal
  if (oldS.channelId && newS.channelId && oldS.channelId !== newS.channelId) {
    const executor = await getExecutor(guild, AuditLogEvent.MemberMove);

    return sendLog(
      guild,
      LOGS_CONFIG,
      "voice",
      new EmbedBuilder()
        .setTitle("🔀 Déplacement vocal")
        .setColor(COLORS.orange)
        .setDescription(`Utilisateur : **${member.user.tag}**`)
        .addFields(
          { name: "De", value: oldS.channel.name, inline: true },
          { name: "Vers", value: newS.channel.name, inline: true },
          { name: "Par", value: executor }
        )
    );
  }

  // ❌ Déconnexion vocale
  if (oldS.channelId && !newS.channelId) {
    const executor = await getExecutor(guild, AuditLogEvent.MemberDisconnect);

    return sendLog(
      guild,
      LOGS_CONFIG,
      "voice",
      new EmbedBuilder()
        .setTitle("❌ Déconnexion vocale")
        .setColor(COLORS.red)
        .setDescription(member.user.tag)
        .addFields({ name: "Par", value: executor })
    );
  }

  // 🔇 Mute / Unmute serveur
  if (oldS.serverMute !== newS.serverMute) {
    const executor = await getExecutor(guild, AuditLogEvent.MemberUpdate);

    return sendLog(
      guild,
      LOGS_CONFIG,
      "voice",
      new EmbedBuilder()
        .setTitle(newS.serverMute ? "🔇 Mute vocal" : "🔊 Unmute vocal")
        .setColor(newS.serverMute ? COLORS.red : COLORS.green)
        .setDescription(`Utilisateur : **${member.user.tag}**`)
        .addFields({ name: "Par", value: executor })
    );
  }

  // 🔈 Deafen / Undeafen serveur
  if (oldS.serverDeaf !== newS.serverDeaf) {
    const executor = await getExecutor(guild, AuditLogEvent.MemberUpdate);

    return sendLog(
      guild,
      LOGS_CONFIG,
      "voice",
      new EmbedBuilder()
        .setTitle(newS.serverDeaf ? "🔈 Casque retiré (Deafen)" : "🎧 Casque rendu (Undeafen)")
        .setColor(newS.serverDeaf ? COLORS.red : COLORS.green)
        .setDescription(`Utilisateur : **${member.user.tag}**`)
        .addFields({ name: "Par", value: executor })
    );
  }
});

  // ======================
  // SALONS
  // ======================
  client.on(Events.ChannelCreate, (channel) =>
    sendLog(
      channel.guild,
      LOGS_CONFIG,
      "channels",
      new EmbedBuilder()
        .setTitle("📂 Salon créé")
        .setColor(COLORS.green)
        .setDescription(channel.name)
    )
  );

  client.on(Events.ChannelDelete, (channel) =>
    sendLog(
      channel.guild,
      LOGS_CONFIG,
      "channels",
      new EmbedBuilder()
        .setTitle("🗑️ Salon supprimé")
        .setColor(COLORS.red)
        .setDescription(channel.name)
    )
  );

  // ======================
  // BANS
  // ======================
  client.on(Events.GuildBanAdd, (ban) =>
    sendLog(
      ban.guild,
      LOGS_CONFIG,
      "bans",
      new EmbedBuilder()
        .setTitle("🔨 Utilisateur banni")
        .setColor(COLORS.purple)
        .setDescription(ban.user.tag)
    )
  );

  client.on(Events.GuildBanRemove, (ban) =>
    sendLog(
      ban.guild,
      LOGS_CONFIG,
      "bans",
      new EmbedBuilder()
        .setTitle("✅ Utilisateur débanni")
        .setColor(COLORS.green)
        .setDescription(ban.user.tag)
    )
  );
};
