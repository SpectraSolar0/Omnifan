const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'giverolesall',
  description: 'Donne tous les rôles du serveur à tous les membres avec une barre de progression.',
  adminOnly: true,
  async execute(message, args) {
    // Vérifie les permissions
    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply("❌ Je n’ai pas la permission de gérer les rôles !");
    }

    // Confirmation
    if (args[0] !== "confirm") {
      return message.reply("⚠️ Cette commande va donner **tous les rôles à tous les membres** !\nTape `!giverolesall confirm` pour confirmer.");
    }

    await message.channel.send("🔄 Récupération des membres du serveur...");
    const members = await message.guild.members.fetch(); // Charge tous les membres
    const roles = message.guild.roles.cache.filter(role => role.editable && role.name !== "@everyone");

    if (roles.size === 0) {
      return message.reply("⚠️ Aucun rôle disponible ou je ne peux pas les gérer.");
    }

    // Message de progression
    let progressMessage = await message.channel.send(`🛠️ Attribution de ${roles.size} rôles à ${members.size} membres...\nProgression : [░░░░░░░░░░] 0%`);

    let count = 0;
    const total = members.size;
    const barLength = 10;

    for (const member of members.values()) {
      try {
        await member.roles.add(roles);
        count++;
      } catch (err) {
        console.log(`❌ Erreur pour ${member.user.tag}: ${err.message}`);
      }

      // Met à jour la barre tous les 5 membres
      if (count % 5 === 0 || count === total) {
        const percent = Math.round((count / total) * 100);
        const filled = Math.round((percent / 100) * barLength);
        const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
        await progressMessage.edit(`🛠️ Attribution des rôles...\nProgression : [${bar}] ${percent}%`);
      }
    }

    await progressMessage.edit(`✅ Terminé ! Tous les membres ont reçu ${roles.size} rôles.\n(${count}/${total} membres traités)`);
  }
};
