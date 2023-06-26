const { EmbedBuilder } = require('discord.js');
module.exports = async (client,thread) => {
	// fetches the parent channel of the thread
	parent = thread.guild.channels.cache.get(thread.parentId);
	if (!parent.name == "questions") return; // stops if the parent channel is not a question channel
	const owner = client.users.cache.get(thread.ownerId) || client.users.fetch(thread.ownerId)
	const embed = new EmbedBuilder()
	.setTitle('Thanks for asking your question!') 
	.setTimestamp()
	.setColor('Random')
	.setDescription('Once you have finished, please close your thread.\nMake sure to provide as much helpful information as possible such as logs/what you tried and what your exact issue is')
	.setFields({name: 'command to close', value: '/close\n!close\n!solved'})
	.setFooter({ text: `Requested by ${owner.displayName}`, iconURL: owner.avatarURL() });

	const msg = await thread.send({ embeds: [embed] })
	await msg.pin()
}
