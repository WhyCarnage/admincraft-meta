const { ApplicationCommandOptionType } = require('discord.js');

module.exports = {
  name: 'eval',
  description: 'Evaluate JavaScript code.',
  aliases: ['ev'],
  args: true,
  usage: '<code>',
  ephemeral: true,
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: 'eval',
      description: 'eval code',
      required: true,
    },
  ],
  async execute(message, args, client) {
    const user = message?.author ?? message?.member?.user ?? message?.user;

    // cleaning function needed to prevent formatting from being a mess (backticks, mentions and the bots token)
    const clean = async (text) => {
      if (text && text.constructor.name == 'Promise') text = await text;
      if (typeof text !== 'string')
        text = require('util').inspect(text, { depth: 1 });
      const token = new RegExp(`^${process.env.token}$`);
      text = text
        .replace(/`/g, '`' + String.fromCharCode(8203))
        .replace(token, '[redacted]')
        .replace(/@/g, '@' + String.fromCharCode(8203));

      return text;
    };
    try {
      if (process.env.BOT_OWNER != user.id) {
        return message.reply('You are not the bot owner', { ephemeral: true });
      }
      // Evaluate (execute) our input

      const evaled = eval(args.join(' '));
      // evaluates the code given. we wrap it in async so we can use await
      //const evaled = eval(`(async () => { await ${args} })();`);
      // Reply in the channel with our result
      await message.reply(`\`\`\`js\n${await clean(evaled)}\n\`\`\``);
    } catch (err) {
      // just tells the user what they asked for cant be done
      if (err?.message?.includes('Missing Permissions')) {
        message.reply('Bot does not have permission to perform this action.');
      }
      else {
      // Error handling will be handled by error handler
      client.error(err, message);
      }
    }
  },
};
