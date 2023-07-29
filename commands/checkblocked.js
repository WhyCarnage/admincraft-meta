// Author: Cooleg <https://github.com/TrollsterCooleg>

const fetch = (...args) =>
  Promise.race([
    import('node-fetch').then(({ default: e }) => e(...args)),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Fetch timeout')), 500) 
    ),
  ]);;
const crypto = require('node:crypto');
const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
let hashes;

function isValidMinecraftServer(input) {
	const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
	const domainRegex = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
  
	return ipv4Regex.test(input) || domainRegex.test(input);
}

function checkNumericIp(parts) {
	if (parts.length !== 4) {return false;}
    for (const part of parts) {
        if (part >= 0 && part <= 255) {
            continue;
        } else {return false;}
    }
    return true;
}

function testBlockedDomain(parts) {
    let currentString = addPoints(parts);
    if (testHash(currentString)) {return true;}
    if (testHash("*." + currentString)) {return true;}
    while (parts.length > 1) {
        parts.shift();
        currentString = "*." + addPoints(parts);
        if (testHash(currentString)) {return true;}
    }
    return false;
}

function testBlockedNumeric(parts) {
    let currentString = addPoints(parts);
    if (testHash(currentString)) {return true;}
    while (parts.length > 1) {
        parts.pop();
        currentString = addPoints(parts) + ".*";
        if (testHash(currentString)) {return true;}
    }
    return false;
}

function addPoints(parts) {
    let value = "";
    for (const part of parts) {
        value = value + `${part}.`;
    }
    return value.substring(0, value.length-1);
}

function testHash(ip) {
    const hasher = crypto.createHash('sha1');
    hasher.update(ip);
    return hashes.includes(hasher.digest('hex'));
}

module.exports = {
	name: 'checkblocked',
	description: 'check if a java server is mojang blocked.',
	aliases: ['blocked'],
	ephemeral: false,
	args: true,
	usage: 'server ip:port',
	cooldown: 20,
	
	options: [
		{
			'type': ApplicationCommandOptionType.String,
			'name': 'server_ip',
			'description': 'The server ip to ping.',
			'required': true,
		}
	],
	async execute(message, args, client) {
	try {

		const input = args[0];
		const ip = encodeURIComponent(input.split(':')[0]).toLowerCase();
		const port = input.split(':')[1] || '25565';
		if (!isValidMinecraftServer(ip)) return message.reply('Invalid server ip.');
        const parts = ip.split('.');
        const numeric = checkNumericIp(parts);

		const response = await fetch('https://sessionserver.mojang.com/blockedservers');
		const text = await response.text();
        hashes = text.split("\n");

        let blocked = numeric ? testBlockedNumeric(parts) : testBlockedDomain(parts);
        let blockedString = blocked ? "is **BLOCKED**" : "is not blocked";

		const user = message?.author ?? message?.member?.user ?? message?.user;	
		// gets the server icon if it exists otherwise uses the default minecraft icon
		let icon = await fetch(`https://eu.mc-api.net/v3/server/favicon/${ip}:${port}`).catch(() => {return {ok: false} });
        if (!icon.ok) {
            icon = "https://mcsrvstat.us/img/minecraft.png"
        } else
        {
        icon = `https://eu.mc-api.net/v3/server/favicon/${ip}:${port}`;
        }
		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle(`${ip}`)
			.setURL(`https://mcsrvstat.us/server/${ip}:${port}`)
			.setDescription(`Server ${blockedString} by mojang.`)
			.setThumbnail(icon)
			.setTimestamp()
			.setAuthor({name: `${user.username}#${user.discriminator}`, iconURL: user.displayAvatarURL({ dynamic: true })})
			.setFooter({text: 'Blocked Server Checker', iconURL: icon});

			message.reply({ embeds: [embed] });
	}
		catch (err) { client.error(err, message); }
	},
};