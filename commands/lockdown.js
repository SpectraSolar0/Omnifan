const fs = require("fs");
const path = require("path");
const { ActivityType } = require("discord.js");

module.exports = {
  name: "lockdown",
  description: "Ferme l'accès à tous les salons et sauvegarde les permissions.",
  async execute(message, args, client) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ Tu dois être administrateur.");
    }

    const guild = message.guild;
    const backupPath = path.join(__dirname, "../lockdown_backup.json");

    try {
      // 1️⃣ Backup des permissions de tous les salons existants
      const backup = {};
      let allChannels = await guild.channels.fetch();
      for (const [, channel] of allChannels) {
        backup[channel.id] = [];
        channel.permissionOverwrites.cache.forEach(po => {
          backup[channel.id].push({
            id: po.id,
            allow: po.allow.bitfield.toString(),
            deny: po.deny.bitfield.toString()
          });
        });
      }
      fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));

      // 2️⃣ Fermer l'accès à @everyone
      for (const [, channel] of allChannels) {
        await channel.permissionOverwrites.edit(guild.roles.everyone, {
          SendMessages: false,
          ViewChannel: false,
          Connect: false,
          Speak: false
        }).catch(() => {});
      }

      // 3️⃣ Supprimer tous les salons urgence existants
      allChannels = await guild.channels.fetch(); // fetch à jour
      const emergencyChannels = allChannels.filter(c => c.name === "annonce-urgence" && c.type === 0);
      for (const [, ch] of emergencyChannels) {
        await ch.delete().catch(() => {});
      }

      // 4️⃣ Attendre 1 seconde pour la synchro Discord
      await new Promise(r => setTimeout(r, 1000));

      // 5️⃣ Créer un seul salon urgence
      const emergencyChannel = await guild.channels.create({
        name: "annonce-urgence",
        type: 0, // texte
        permissionOverwrites: [
          { id: guild.roles.everyone.id, allow: ["ViewChannel", "SendMessages"] }
        ]
      });

      // 6️⃣ Envoyer le message
      await emergencyChannel.send("@everyone 🚨 **Le serveur a été mis en LOCKDOWN.**");
      if (message.channel) message.channel.send("✅ Lockdown activé.");

      // 7️⃣ Changer le statut
      await client.user.setPresence({
        activities: [{ name: "l'état d'alerte", type: ActivityType.Watching }],
        status: "dnd"
      });

    } catch (err) {
      console.error(err);
      if (message.channel) message.channel.send("❌ Une erreur est survenue pendant le lockdown.");
    }
  }
};
