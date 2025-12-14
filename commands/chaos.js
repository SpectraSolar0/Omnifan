const { PermissionsBitField } = require("discord.js");

module.exports = {
    name: "chaos",
    async execute(message) {
        // Vérification des permissions
        if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return message.reply("❌ Tu n’as pas la permission d’utiliser cette commande.");
        }

        message.reply("💥 Création de 100 salons en cours...");

        for (let i = 1; i <= 100; i++) {
            try {
                await message.guild.channels.create({
                    name: `boom-${i}`,
                    type: 0 // 0 = salon texte
                });

                // Petite pause pour éviter le rate limit
                await new Promise(resolve => setTimeout(resolve, 300));
            } catch (error) {
                console.error(`Erreur lors de la création du salon ${i}`, error);
            }
        }

        message.channel.send("✅ Les 100 salons ont été créés !");
    }
};
