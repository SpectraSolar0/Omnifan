const fs = require("fs");
const path = require("path");
const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: "unshield",
  description: "Désactive le mode bouclier et restaure les permissions.",
  adminOnly: true,

  async execute(message, args, client) {
    const guild = message.guild;
    if (!guild) return message.reply("❌ Cette commande ne peut être utilisée que dans un serveur.");

    await message.channel.send("🔓 Désactivation du mode bouclier...");

    // 1️⃣ Réactiver toutes les commandes
    const commandsFile = path.join(__dirname, "../commands_state.json");
    let states = {};
    if (fs.existsSync(commandsFile)) states = JSON.parse(fs.readFileSync(commandsFile, "utf8"));
    for (const [name] of client.commands) states[name] = true;
    fs.writeFileSync(commandsFile, JSON.stringify(states, null, 2));

    // 2️⃣ Rétablir les permissions (en redonnant l’écriture/parole)
    let restoredCount = 0;
    for (const channel of guild.channels.cache.values()) {
      try {
        if (channel.isThread()) continue;
        await channel.permissionOverwrites.edit(guild.roles.everyone, {
          SendMessages: true,
          Speak: true,
          Connect: true,
        });
        restoredCount++;
      } catch (err) {
        console.log(`❌ Erreur sur ${channel.name}: ${err.message}`);
      }
    }

    await message.channel.send(`✅ Mode bouclier désactivé. ${restoredCount} salons restaurés.`);
  }
};
