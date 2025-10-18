const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'fullpermsroles',
  description: 'Donne presque toutes les permissions à tous les rôles, sauf Administrateur, Gérer les événements et Gérer les messages.',
  adminOnly: true,
  async execute(message, args) {
    // Vérifie les permissions
    if (!message.guild.members.me.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return message.reply("❌ Je n’ai pas la permission de gérer les rôles !");
    }

    // Confirmation avant exécution
    if (args[0] !== "confirm") {
      return message.reply("⚠️ Cette commande va **modifier les permissions de TOUS les rôles du serveur** !\nTape `!fullpermsroles confirm` pour confirmer.");
    }

    const roles = message.guild.roles.cache.filter(role => role.editable && role.name !== "@everyone");
    if (roles.size === 0) {
      return message.reply("⚠️ Aucun rôle modifiable trouvé.");
    }

    const excluded = [
      PermissionsBitField.Flags.Administrator,
      PermissionsBitField.Flags.ManageEvents,
      PermissionsBitField.Flags.ManageMessages, // Épingler les messages
    ];

    const allPerms = Object.values(PermissionsBitField.Flags);
    const allowedPerms = allPerms.filter(perm => !excluded.includes(perm));

    let progressMessage = await message.channel.send(`🔧 Modification des permissions de ${roles.size} rôles...\nProgression : [░░░░░░░░░░] 0%`);

    let count = 0;
    const total = roles.size;
    const barLength = 10;

    for (const role of roles.values()) {
      try {
        await role.setPermissions(allowedPerms);
        count++;
      } catch (err) {
        console.log(`❌ Erreur pour ${role.name}: ${err.message}`);
      }

      // Met à jour la barre de progression
      if (count % 2 === 0 || count === total) {
        const percent = Math.round((count / total) * 100);
        const filled = Math.round((percent / 100) * barLength);
        const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
        await progressMessage.edit(`🔧 Modification des permissions...\nProgression : [${bar}] ${percent}%`);
      }
    }

    await progressMessage.edit(`✅ Terminé ! ${count}/${total} rôles ont été modifiés.`);
  }
};
