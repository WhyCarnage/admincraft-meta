module.exports = {
	name: 'privacy',
	description: 'View the bot\'s privacy policy.',
	aliases: ['policy'],
	cooldown: 10,
	async execute(message, args, client) {
		try {
			message.reply(`You can view the bot\'s privacy policy at ${process.env.GITHUB_URL}/blob/main/Privacy.md`);
		}
		catch (err) { client.error(err, message); }
	},
};