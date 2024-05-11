const { EmbedBuilder } = require('discord.js');
module.exports = async (client, interaction) => {
	// Check if interaction is command
	if (!interaction.isChatInputCommand()) return;

	// Get the command from the available cmds in the bot, if there isn't one, just return because discord will throw an error itself
	const command = client.commands.get(interaction.commandName);
	if (!command) return;
	// Make args variable from interaction options for compatibility with message command code
	const args = interaction.options._hoistedOptions;

	// Set args to value of options
	args.forEach(arg => args[args.indexOf(arg)] = arg.value);

	// Log the command
	const cmdlog = args.join ? `${command.name} ${args.join(' ')}` : command.name;
	client.logger.info(`${interaction.user.tag} issued slash command: /${cmdlog} in ${interaction.guild ? interaction.guild.name : interaction.user.username + `#${interaction.user.discriminator}'s DM`}`);

	// Execute the command and catch any errors
	command.execute(interaction, args, client)
		.catch(err => {
			const interactionFailed = new EmbedBuilder()
				.setColor('#E0115F')
				.setTitle('INTERACTION FAILED')
				.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() })
				.addFields([
					{ name: '**Type:**', value: 'Slash' },
					{ name: '**Interaction:**', value: command.name },
					{ name: '**Guild:**', value: interaction?.guild?.name ?? 'Direct Messages' },
					{ name: '**Channel:**', value: interaction?.channel?.name ?? `${interaction.user.tag}` },
					{ name: '**Error:**', value: `\`\`\`\n${err}\n\`\`\`` },
				]);
			interaction.editReply({ embeds: [interactionFailed] }).catch(err => client.logger.warn(err));
			client.logger.error(`${err.stack} in ${interaction?.guild?.name ?? interaction.user.tag} (DMs)`);
		});

};