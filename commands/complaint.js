const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
    // Envoie le panneau pour créer une plainte
    sendComplaintPanel: async function(channel) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_complaint')
                    .setLabel('Déposer une plainte')
                    .setStyle(ButtonStyle.Danger)
            );

        await channel.send({
            content: 'Clique sur le bouton pour déposer une plainte !',
            components: [row]
        });
    },

    // Gère les interactions avec le bouton
    handleComplaintInteraction: async function(interaction) {
        if (!interaction.isButton()) return;

        const guild = interaction.guild;
        const user = interaction.user;

        if (interaction.customId === 'create_complaint') {
            // Vérifie si l'utilisateur a déjà une plainte
            const existing = guild.channels.cache.find(c => c.name === `plainte-${user.id}`);
            if (existing) {
                return interaction.reply({ content: 'Tu as déjà une plainte ouverte !', ephemeral: true });
            }

            // Crée le salon de plainte
            const complaintChannel = await guild.channels.create({
                name: `plainte-${user.id}`,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
                    { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
                ]
            });

            await complaintChannel.send(`Bienvenue ${user}, ta plainte est créée !`);
            await interaction.reply({ content: 'Ta plainte a été créée ✅', ephemeral: true });
        }

        // Bouton pour fermer la plainte
        if (interaction.customId.startsWith('close_complaint')) {
            const channel = interaction.channel;
            await channel.delete().catch(err => console.error(err));
        }
    },

    // Ajouter un utilisateur à une plainte
    addUserToComplaint: async function(complaintChannel, member) {
        await complaintChannel.permissionOverwrites.edit(member.id, {
            ViewChannel: true,
            SendMessages: true
        });
        await complaintChannel.send(`${member} a été ajouté à la plainte.`);
    },

    // Fermer la plainte
    closeComplaint: async function(complaintChannel) {
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('close_complaint')
                    .setLabel('Fermer la plainte')
                    .setStyle(ButtonStyle.Secondary)
            );

        await complaintChannel.send({ content: 'Clique sur le bouton pour fermer la plainte.', components: [row] });
    }
};
