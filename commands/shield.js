const fs = require("fs");
const path = require("path");
const {
  EmbedBuilder,
  PermissionsBitField,
  Colors
} = require("discord.js");

module.exports = {
  name: "shield",
  description: "Active le mode bouclier de sécurité sur le serveur.",
  adminOnly: true,

  async execute(message, args, client) {
    const guild = message.guild;
    if (!guild) return message.reply("❌ Cette commande ne peut être utilisée que dans un serveur.");

    if (args[0] !== "confirm") {
      const embedWarn = new EmbedBuilder()
        .setTitle("⚠️ Confirmation requise")
        .setDescription(
          "**ATTENTION :** Cette commande va :\n" +
          "• Bloquer tous les salons en écriture et en vocal\n" +
          "• Désactiver toutes les commandes sauf `+unshield`\n\n" +
          "👉 Tape `+shield confirm` pour confirmer."
        )
        .setColor(Colors.Yellow);
      return message.reply({ embeds: [embedWarn] });
    }

    const commandsFile = path.join(__dirname, "../commands_state.json");
    const backupFile = path.join(__dirname, "../permissions_backup.json");

    const embedStart = new EmbedBuilder()
      .setTitle("🛡️ Activation du bouclier...")
      .setColor(Colors.Blurple)
      .setDescription("Sauvegarde des permissions et verrouillage en cours...");
    await message.channel.send({ embeds: [embedStart] });

    // 1️⃣ Sauvegarde les permissions actuelles
    const backup = {};
    for (const channel of guild.channels.cache.values()) {
      if (channel.isThread()) continue;
      const everyonePerms = channel.permissionOverwrites.cache.get(guild.roles.everyone.id);
      if (everyonePerms) {
        backup[channel.id] = {
          allow: everyonePerms.allow.bitfield.toString(),
          deny: everyonePerms.deny.bitfield.toString(),
        };
      }
    }
    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2));

    // 2️⃣ Bloque les messages et les vocaux sans cacher les salons
    let protectedCount = 0;
    for (const channel of guild.channels.cache.values()) {
      if (channel.isThread()) continue;
      try {
        await channel.permissionOverwrites.edit(guild.roles.everyone, {
          SendMessages: false,
          AddReactions: false,
          Speak: false,
          Connect: false,
          Stream: false,
          ViewChannel: true,
        });
        protectedCount++;
      } catch (err) {
        console.log(`❌ Erreur sur ${channel.name}: ${err.message}`);
      }
    }

    // 3️⃣ Désactiver toutes les commandes sauf +unshield
    let states = {};
    if (fs.existsSync(commandsFile)) states = JSON.parse(fs.readFileSync(commandsFile, "utf8"));
    for (const [name] of client.commands) states[name] = name === "unshield";
    fs.writeFileSync(commandsFile, JSON.stringify(states, null, 2));

    // 4️⃣ Message final
    const embedEnd = new EmbedBuilder()
      .setTitle("✅ Bouclier activé !")
      .setColor(Colors.Green)
      .setDescription(
        `**${protectedCount} salons** ont été sécurisés.\n\n` +
        "Toutes les commandes sont désactivées sauf `+unshield`."
      )
      .setFooter({ text: "Serveur en mode protection totale." });
    await message.channel.send({ embeds: [embedEnd] });
  }
};
