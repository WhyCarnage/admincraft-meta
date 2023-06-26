const { PermissionFlagsBits, EmbedBuilder } = require('discord.js');
module.exports = {
	name: 'close',
	description: 'Closes the post and marks it as solved.',
	ephemeral: false,
	aliases: ['solved','s'],
	cooldown: 10,
	async execute(message, args, client) {

        // prevents the command from being ran in non question channels
        if (message.channel.parent.name != "questions") return;
        // checks if the person running command owns it or has manage threads perms
        if ( message.channel.ownerId != message.member.id && !message.member.permissions.has(PermissionFlagsBits.ManageThreads) ) return message.reply({ content: 'Only moderators and the Post owner can mark this as solved!', ephemeral: true });
        // creates embed
        const solvedEmbed = new EmbedBuilder()
            .setColor('Random')
            .setTitle('Closed post!')
            .setDescription(`Your post has been marked as solved!`)
            .setTimestamp();
			// reply with embed
        try {
            // fetches the post and marks it as solved
            const postMessage = await message.channel.fetch(message.targetId);
            const availableTags = message.channel.parent.availableTags
            // dynamically gets the solved tag id

            // checks if the bot has perms to modify the post
            if (!message.channel.permissionsFor(message.guild.members.me).has(PermissionFlagsBits.ManageThreads)) {
                return await message.reply("I cannot modify this post as i don't have permission to do so!")
            }
            const user = message?.author || message?.user|| message?.member
            const solvedTag = await availableTags.find(t => t.name.toLowerCase() == 'solved')?.id
            await postMessage.setAppliedTags([solvedTag], 'Marked as solved By ' + user.username + '#' + user.discriminator)
            if (!message.channel.archived) {
            await message.reply({ embeds: [solvedEmbed] }).then(m => setTimeout(() => m.delete(), 1500)).then(async() => setTimeout(async() => await postMessage.setArchived(true, 'Marked as solved By ' + user.tag), 2000))
            
            }

        }

		catch (err) { 
            client.error(err, message);
        }
    }
};