const fetch = (...args) => import('node-fetch').then(({ default: e }) => e(...args));
const { EmbedBuilder, ApplicationCommandOptionType, PermissionsBitField } = require('discord.js');

function isValidMinecraftServer(input) {
	const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
	const domainRegex = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
  
	return ipv4Regex.test(input) || domainRegex.test(input);
  }
  
  
module.exports = {
	name: 'checkserver',
	description: 'ping a server and get info on it.',
	aliases: ['cs'],
	ephemeral: false,
	args: true,
	usage: '<server ip>:<port> (dont add the port if its 25565) <java/bedrock>',
	cooldown: 20,
	
	options: [
		{
			'type': ApplicationCommandOptionType.String,
			'name': 'server_ip',
			'description': 'The server ip to ping.',
			'required': true,
		},
		{
			'type': ApplicationCommandOptionType.String,
			'name': 'java_bedrock',
			'description': 'The server type.',
			'required': true,
			'choices': [
				{
					'name': 'Java',
					'value': 'java',
				},
				{
					'name': 'Bedrock',
					'value': 'bedrock',
				},
			],	
		}
	],
	async execute(message, args, client) {
	try {

		if (!args[0]) return await message.reply('You did not specify a server ip.')
		if (!args[1]) return await message.reply('You did not specify a server type.')
		const input = args[0];
		const ip = encodeURIComponent(input.split(':')[0]);
		const port = input.split(':')[1] || '25565';
		let url = '';
		if (!isValidMinecraftServer(ip)) return message.reply('Invalid server ip.');

		if (args[1] == 'java') {
			url = `https://api.mcsrvstat.us/2/${ip}:${port}`;
		}
		else if (args[1] == 'bedrock') {
			url = `https://api.mcsrvstat.us/bedrock/2/${ip}:${port}`;
		}
		const response = await fetch(url);
		const json = await response.json();

		if (json.online === true) {

			// plugins = json.plugins.name.join(', '); // we can use this if we want to show the plugins in a list without the version stuff im doing below 
			let plugins;
			if (json?.plugins) {
				for (i in json.plugins.raw) {
					plugins += `${json.plugins.names[i]} (${json.plugins.raw[i].split(' ')[1]}), `;
				}
				}
			
			const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle(`${json.hostname ?? json.ip}:${json.port}`)
				.setURL(`https://mcsrvstat.us/server/${ip}:${port}`)
				.setDescription(`**IP:** ${json.ip}:${json.port}\n**Version:** ${json.version}\n**Players:** ${json.players.online}/${json.players.max}\n**MOTD:** ${json.motd.clean.join('\n')}`)
				.setThumbnail(`https://api.mcsrvstat.us/icon/${ip}:${port}`)
				.setAuthor({name: 'Server is Online', iconURL: 'https://mcsrvstat.us/img/minecraft.png'})
				.setTimestamp()
				.setFooter({text: 'Server Checker', iconURL: 'https://mcsrvstat.us/img/minecraft.png'});
				if (json?.plugins) embed.addFields({ name: 'Plugins', value: `${json.plugins ? plugins : 'No plugins'}`, inline: true })
				if (json?.mods) embed.addFields({ name: 'Mods', value: `${json.mods ? json.mods.name.join(', ') : 'No mods'}`, inline: true })

			message.reply({ embeds: [embed] });

        }
		else {
			const embed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle(`no server found`)
				.setURL(`https://mcsrvstat.us/server/${ip}:${port}`)
				.setDescription(`**No server found**\n You may have entered the wrong ip/port or the server is offline. `)
				.setThumbnail(`https://api.mcsrvstat.us/icon/${ip}:${port}`)
				.setAuthor({name: 'Server is offline', iconURL: 'https://mcsrvstat.us/img/minecraft.png'})
				.setTimestamp()
				.setFooter({text: 'Server Checker', iconURL: 'https://mcsrvstat.us/img/minecraft.png'});
			message.reply({ embeds: [embed] });
		}
	}
		catch (err) { client.error(err, message); }
	},
};