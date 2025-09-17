const fs = require("fs");
const path = require("path");
const { ActivityType } = require("discord.js");

module.exports = {
  name: "unlockdown",
  description: "Rouvre tous les salons et supprime le salon urgence.",
  async execute(message, args, client) {
    if (!message.member.permissions.has("Administrator")) {
      return message.reply("❌ Tu dois être administrateur.");
    }

    const guild = message.guild;
    const backupPath = path.join(__dirname, "../lockdown_backup.json");

    try {
      if (!fs.existsSync(backupPath)) {
        return message.reply("❌ Aucun backup trouvé.");
      }

      const backup = JSON.parse(fs.readFileSync(backupPath));
      const allChannels = await guild.channels.fetch();

      // 🔓 Restaurer les permissions
      for (const channelId in backup) {
        const channel = allChannels.get(channelId);
        if (!channel) continue;

        await channel.permissionOverwrites.set([]).catch(() => {});
        for (const po of backup[channelId]) {
          await channel.permissionOverwrites.edit(po.id, {
            allow: BigInt(po.allow),
            deny: BigInt(po.deny)
          }).catch(() => {});
        }
      }

      // ❌ Supprimer le salon urgence
      const emergencyChannels = allChannels.filter(c => c.name === "annonce-urgence" && c.type === 0);
      for (const [, ch] of emergencyChannels) await ch.delete().catch(() => {});

      // ❌ Supprimer le backup
      fs.existsSync(backupPath) && fs.unlinkSync(backupPath);

      if (message.channel) message.channel.send("🔓 Unlock effectué et salon urgence supprimé.");

      // ✨ Remettre le statut
      await client.user.setPresence({
        activities: [{ name: "les révolutions 👀", type: ActivityType.Watching }],
        status: "online"
      });

    } catch (err) {
      console.error(err);
      if (message.channel) message.channel.send("❌ Une erreur est survenue pendant l'unlockdown.");
    }
  }
};
