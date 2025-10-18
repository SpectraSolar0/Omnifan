const fs = require("fs");
const path = require("path");
const { PermissionsBitField } = require("discord.js");

module.exports = {
  name: "shield",
  description: "Active le mode bouclier de sécurité du serveur.",
  adminOnly: true,

  async execute(message, args, client) {
    const guild = message.guild;
    if (!guild) return message.reply("❌ Cette commande ne peut être utilisée que dans un serveur.");

    const confirm = args[0];
    if (confirm !== "confirm") {
      return message.reply("⚠️ Cette commande va **protéger entièrement le serveur** :\n" +
        "- Bloquer les messages et la parole pour tous\n" +
        "- Désactiver toutes les commandes sauf `+unshield`\n\n" +
        "✅ Tape `+shield confirm` pour confirmer.");
    }

    await message.channel.send("🛡️ Activation du mode bouclier...");

    // 1️⃣ Désactiver toutes les commandes sauf +unshield
    const commandsFile = path.join(__dirname, "../commands_state.json");
    let states = {};
    if (fs.existsSync(commandsFile)) states = JSON.parse(fs.readFileSync(commandsFile, "utf8"));
    for (const [name] of client.commands) {
      states[name] = name === "unshield"; // seul +unshield reste actif
    }
    fs.writeFileSync(commandsFile, JSON.stringify(states, null, 2));
    await message.channel.send("🔒 Commandes verrouillées (sauf `+unshield`).");

    // 2️⃣ Modifier permissions des salons
    let protectedCount = 0;
    for (const channel of guild.channels.cache.values()) {
      try {
        if (channel.isThread()) continue; // ignore les threads
        const perms = channel.permissionOverwrites.cache.get(guild.roles.everyone.id);
        const currentView = perms?.allow?.has(PermissionsBitField.Flags.ViewChannel);

        await channel.permissionOverwrites.edit(guild.roles.everyone, {
          SendMessages: false,
          Speak: false,
          Connect: false,
          ViewChannel: currentView ?? true, // ne cache pas si déjà visible
        });
        protectedCount++;
      } catch (err) {
        console.log(`❌ Erreur sur ${channel.name}: ${err.message}`);
      }
    }

    await message.channel.send(`✅ Mode bouclier activé sur ${protectedCount} salons.`);
  }
};
