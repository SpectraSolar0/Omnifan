const fs = require("fs");
const path = require("path");
const {
  EmbedBuilder,
  PermissionsBitField,
  Colors
} = require("discord.js");

module.exports = {
  name: "unshield",
  description: "Désactive le bouclier et restaure les permissions du serveur.",
  adminOnly: true,

  async execute(message, args, client) {
    const guild = message.guild;
    if (!guild) return message.reply("❌ Cette commande ne peut être utilisée que dans un serveur.");

    const commandsFile = path.join(__dirname, "../commands_state.json");
    const backupFile = path.join(__dirname, "../permissions_backup.json");

    const embedStart = new EmbedBuilder()
      .setTitle("🔓 Désactivation du bouclier...")
      .setColor(Colors.Orange)
      .setDescription("Restauration des permissions en cours...");
    await message.channel.send({ embeds: [embedStart] });

    // 1️⃣ Restaurer les permissions sauvegardées
    if (!fs.existsSync(backupFile)) {
      const embedError = new EmbedBuilder()
        .setTitle("⚠️ Aucune sauvegarde trouvée !")
        .setColor(Colors.Red)
        .setDescription("Impossible de restaurer les permissions, aucune sauvegarde n’a été trouvée.");
      await message.channel.send({ embeds: [embedError] });
    } else {
      const backup = JSON.parse(fs.readFileSync(backupFile, "utf8"));
      let restoredCount = 0;

      for (const [channelId, perms] of Object.entries(backup)) {
        const channel = guild.channels.cache.get(channelId);
        if (!channel) continue;
        try {
          await channel.permissionOverwrites.edit(guild.roles.everyone, {
            allow: new PermissionsBitField(BigInt(perms.allow)),
            deny: new PermissionsBitField(BigInt(perms.deny)),
          });
          restoredCount++;
        } catch (err) {
          console.log(`❌ Erreur sur ${channel.name}: ${err.message}`);
        }
      }

      fs.unlinkSync(backupFile);

      const embedDone = new EmbedBuilder()
        .setTitle("✅ Bouclier désactivé !")
        .setColor(Colors.Green)
        .setDescription(`Permissions restaurées sur **${restoredCount} salons**.`);
      await message.channel.send({ embeds: [embedDone] });
    }

    // 2️⃣ Réactiver toutes les commandes
    let states = {};
    if (fs.existsSync(commandsFile)) states = JSON.parse(fs.readFileSync(commandsFile, "utf8"));
    for (const [name] of client.commands) states[name] = true;
    fs.writeFileSync(commandsFile, JSON.stringify(states, null, 2));

    const embedFinal = new EmbedBuilder()
      .setTitle("🔓 Commandes réactivées")
      .setColor(Colors.Blue)
      .setDescription("Toutes les commandes du bot sont de nouveau disponibles.");
    await message.channel.send({ embeds: [embedFinal] });
  }
};
