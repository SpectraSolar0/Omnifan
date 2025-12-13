const { Events, AuditLogEvent, EmbedBuilder } = require("discord.js");
const fs = require("fs");
const path = require("path");

// ======================
// CONFIG
// ======================
const CONFIG_PATH = path.join(__dirname, "logs_config.json");
const FOOTER = { text: "Logger • discord.js" };

const COLORS = {
  red: 0xE74C3C,
  green: 0x2ECC71,
  orange: 0xE67E22,
  yellow: 0xF1C40F,
  blue: 0x3498DB,
  darkBlue: 0x2980B9,
  purple: 0x8E44AD,
};

// ======================
// HELPERS
// ======================
function readConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
  } catch {
    return null;
  }
}

async function getLogChannel(guild) {
  const cfg = readConfig();
  if (!cfg?.logChannel) return null;

  const channel = await guild.channels.fetch(cfg.logChannel).catch(() => null);
  return channel?.isTextBased() ? channel : null;
}

function safe(text, max = 1024) {
  if (!text) return "(vide)";
  return text.length > max ? `${text.slice(0, max - 3)}...` : text;
}

async function sendLog(guild, embed) {
  const channel = await getLogChannel(guild);
  if (!channel) return;

  embed.setTimestamp().setFooter(FOOTER);
  channel.send({ embeds: [embed] }).catch(() => {});
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
module.exports = (client) => {
  console.log("📡 Logger complet chargé.");

  // --------------------
  // MESSAGE SUPPRIMÉ
  // --------------------
  client.on(Events.MessageDelete, async (message) => {
    if (!message.guild) return;
    if (message.partial) {
      try { message = await message.fetch(); } catch { return; }
    }

    const embed = new EmbedBuilder()
      .setTitle("🗑️ Message supprimé")
      .setColor(COLORS.red)
      .addFields(
        { name: "Auteur", value: safe(message.author?.tag), inline: true },
        { name: "Salon", value: message.channel ? `<#${message.channel.id}>` : "Inconnu", inline: true },
        { name: "Contenu", value: safe(message.content || (message.attachments.size ? "[Pièce jointe]" : "(non disponible)")) }
      )
      .setThumbnail(message.author?.displayAvatarURL());

    sendLog(message.guild, embed);
  });

  // --------------------
  // MESSAGE MODIFIÉ
  // --------------------
  client.on(Events.MessageUpdate, async (oldMsg, newMsg) => {
    const guild = newMsg.guild ?? oldMsg.guild;
    if (!guild) return;

    const before = oldMsg?.content ?? "(non disponible)";
    const after = newMsg?.content ?? "(vide)";
    if (before === after) return;

    const embed = new EmbedBuilder()
      .setTitle("✏️ Message modifié")
      .setColor(COLORS.yellow)
      .addFields(
        { name: "Auteur", value: safe(newMsg.author?.tag), inline: true },
        { name: "Salon", value: newMsg.channel ? `<#${newMsg.channel.id}>` : "Inconnu", inline: true },
        { name: "Avant", value: safe(before) },
        { name: "Après", value: safe(after) }
      )
      .setThumbnail(newMsg.author?.displayAvatarURL());

    sendLog(guild, embed);
  });

  // --------------------
  // MEMBRE REJOINT / QUITTE
  // --------------------
  client.on(Events.GuildMemberAdd, (member) => {
    sendLog(member.guild, new EmbedBuilder()
      .setTitle("👋 Nouveau membre")
      .setColor(COLORS.green)
      .setDescription(`${member.user.tag} a rejoint le serveur.`)
      .setThumbnail(member.user.displayAvatarURL())
    );
  });

  client.on(Events.GuildMemberRemove, (member) => {
    sendLog(member.guild, new EmbedBuilder()
      .setTitle("🚪 Membre parti")
      .setColor(COLORS.orange)
      .setDescription(`${member.user.tag} a quitté le serveur.`)
      .setThumbnail(member.user.displayAvatarURL())
    );
  });

  // --------------------
  // RÔLES MEMBRE
  // --------------------
  client.on(Events.GuildMemberUpdate, (oldM, newM) => {
    const oldRoles = oldM.roles.cache.filter(r => r.id !== newM.guild.id);
    const newRoles = newM.roles.cache.filter(r => r.id !== newM.guild.id);

    const added = newRoles.filter(r => !oldRoles.has(r.id));
    const removed = oldRoles.filter(r => !newRoles.has(r.id));
    if (!added.size && !removed.size) return;

    const embed = new EmbedBuilder()
      .setTitle("🎭 Rôles modifiés")
      .setColor(COLORS.blue)
      .setDescription(`Utilisateur : **${newM.user.tag}**`)
      .setThumbnail(newM.user.displayAvatarURL());

    if (added.size) embed.addFields({ name: "Ajoutés", value: safe(added.map(r => r.name).join(", ")) });
    if (removed.size) embed.addFields({ name: "Retirés", value: safe(removed.map(r => r.name).join(", ")) });

    sendLog(newM.guild, embed);
  });

  // --------------------
  // VOICE (JOIN / LEAVE / MOVE)
  // --------------------
  client.on(Events.VoiceStateUpdate, async (oldS, newS) => {
    const guild = newS.guild ?? oldS.guild;
    if (!guild) return;

    // 🔊 JOIN
    if (!oldS.channelId && newS.channelId) {
      return sendLog(guild, new EmbedBuilder()
        .setTitle("🔊 Connexion vocale")
        .setColor(COLORS.green)
        .addFields(
          { name: "Utilisateur", value: newS.member?.user.tag ?? "Inconnu", inline: true },
          { name: "Salon", value: newS.channel?.name ?? "Inconnu", inline: true }
        )
        .setThumbnail(newS.member?.user.displayAvatarURL())
      );
    }

    // ❌ LEAVE
    if (oldS.channelId && !newS.channelId) {
      const executor = await getExecutor(guild, AuditLogEvent.MemberDisconnect);

      return sendLog(guild, new EmbedBuilder()
        .setTitle("❌ Déconnexion vocale")
        .setColor(COLORS.red)
        .addFields(
          { name: "Utilisateur", value: oldS.member?.user.tag ?? "Inconnu", inline: true },
          { name: "Salon", value: oldS.channel?.name ?? "Inconnu", inline: true },
          { name: "Par", value: executor, inline: true }
        )
        .setThumbnail(oldS.member?.user.displayAvatarURL())
      );
    }

    // 🔄 MOVE
    if (oldS.channelId && newS.channelId && oldS.channelId !== newS.channelId) {
      const executor = await getExecutor(guild, AuditLogEvent.MemberMove);

      return sendLog(guild, new EmbedBuilder()
        .setTitle("🔄 Déplacement vocal")
        .setColor(COLORS.darkBlue)
        .addFields(
          { name: "Utilisateur", value: oldS.member?.user.tag ?? "Inconnu", inline: true },
          { name: "De", value: oldS.channel?.name ?? "Inconnu", inline: true },
          { name: "Vers", value: newS.channel?.name ?? "Inconnu", inline: true },
          { name: "Par", value: executor, inline: true }
        )
        .setThumbnail(newS.member?.user.displayAvatarURL())
      );
    }
  });

  // --------------------
  // RÔLES
  // --------------------
  client.on(Events.GuildRoleCreate, (role) => sendLog(role.guild,
    new EmbedBuilder().setTitle("➕ Rôle créé").setColor(COLORS.green).addFields({ name: "Nom", value: role.name })
  ));

  client.on(Events.GuildRoleDelete, (role) => sendLog(role.guild,
    new EmbedBuilder().setTitle("🗑️ Rôle supprimé").setColor(COLORS.red).addFields({ name: "Nom", value: role.name })
  ));

  client.on(Events.GuildRoleUpdate, (oldR, newR) => {
    if (oldR.name === newR.name) return;
    sendLog(newR.guild, new EmbedBuilder()
      .setTitle("⚙️ Rôle modifié")
      .setColor(COLORS.orange)
      .addFields(
        { name: "Avant", value: safe(oldR.name), inline: true },
        { name: "Après", value: safe(newR.name), inline: true }
      )
    );
  });

  // --------------------
  // SALONS
  // --------------------
  client.on(Events.ChannelCreate, (channel) => sendLog(channel.guild,
    new EmbedBuilder().setTitle("📂 Salon créé").setColor(COLORS.green).addFields({ name: "Nom", value: channel.name })
  ));

  client.on(Events.ChannelDelete, (channel) => sendLog(channel.guild,
    new EmbedBuilder().setTitle("🗑️ Salon supprimé").setColor(COLORS.red).addFields({ name: "Nom", value: channel.name })
  ));

  client.on(Events.ChannelUpdate, (oldC, newC) => {
    if (oldC.name === newC.name) return;
    sendLog(newC.guild, new EmbedBuilder()
      .setTitle("⚙️ Salon modifié")
      .setColor(COLORS.orange)
      .addFields(
        { name: "Avant", value: safe(oldC.name), inline: true },
        { name: "Après", value: safe(newC.name), inline: true }
      )
    );
  });

  // --------------------
  // BANS
  // --------------------
  client.on(Events.GuildBanAdd, (ban) => sendLog(ban.guild,
    new EmbedBuilder().setTitle("🔨 Utilisateur banni").setColor(COLORS.purple).addFields({ name: "Utilisateur", value: ban.user.tag })
  ));

  client.on(Events.GuildBanRemove, (ban) => sendLog(ban.guild,
    new EmbedBuilder().setTitle("✅ Utilisateur débanni").setColor(COLORS.green).addFields({ name: "Utilisateur", value: ban.user.tag })
  ));
};
