const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
const stringSimilarity = require('string-similarity');
// valid slash command  options
const opts = [
  { name: 'Bukkit', value: 'bukkit' },
  { name: 'PaperMc', value: 'papermc' },
  { name: 'Purpur', value: 'purpur' },

]

// valid options for the command 
const valid_options = ["bukkit", "paper", "papermc", 'paperspigot', "purpur", "purpurmc", 'purpurspigot']

module.exports = {
  name: 'rtfm',
  description: 'Read the fucking manual will ya?!',
  ephemeral: true,
  aliases: ['r'],
  usage: `<${opts.map((o) => o.name).join(' | ')}> <term> (term must be more than 3 letters)`,
  args: true,
  cooldown: 15,
  options: [
    {
      'type': ApplicationCommandOptionType.String,
      'name': 'manual',
      'description': 'The manual you wish to search from.',
      'required': true,
      'choices': opts,
    },
    {
      'type': ApplicationCommandOptionType.String,
      'name': 'search',
      'description': 'What you are looking for',
      'required': true,
    }
  ], async execute(message, args, client) {
    try {
      if (message.type == 2) await message.deferReply({ ephemeral: true });

      // couldn't be asked to figure out why discord gives different responses here
      const user = message?.author ?? message?.member?.user ?? message?.user;

      // further error handling such as not giving a search term or too short of one
      if (!args[1]) return await message.reply('You did not give a search term')
      if (args[1].length < 3) return message.reply('You must use at least 3 characters')

      // changes the input into the closest
      const matches = stringSimilarity.findBestMatch(args[0].toLowerCase(), valid_options);
      const manual = matches.bestMatch.target;
      if (['paper', 'papermc', 'paperspigot'].includes(manual)) {
        const response1 = await axios.get('https://docs.papermc.io/paper/reference/paper-global-configuration');
        const html1 = response1.data;
        const response2 = await axios.get('https://docs.papermc.io/paper/reference/world-configuration');
        const html2 = response2.data;

        const $1 = cheerio.load(html1);
        const anchor1 = $1('h3');
        const $2 = cheerio.load(html2);
        const anchor2 = $2('h3');

        const configuration = [];
        const found = [];
        let result = '';
        const re = new RegExp(args[1], 'i');
        for (let i = 0; i < anchor1.length; i++) {
          let href = $1(anchor1[i]).find('a').attr('href').replace('#', '');
          const settingValue = $1(anchor1[i]).next().text().trim();
          const url = `https://docs.papermc.io/paper/reference/paper-global-configuration#${href}`;
          configuration.push({ url, href });
        }

        for (let i = 0; i < anchor2.length; i++) {
          const href = $2(anchor2[i]).find('a').attr('href').replace('#', '');
          const settingValue = $2(anchor2[i]).next().text().trim();
          const url = `https://docs.papermc.io/paper/reference/world-configuration#${href}`;
          configuration.push({ url, href });
        }

        for (let i = 0; i < configuration.length; i++) {
          if (re.test(configuration[i].href)) {
            found.push(configuration[i]);
          }
        }

        for (let i = 0; i < found.length; i++) {
          result += `\n[${found[i].href}](${found[i].url})`;
        }

        if (found.length === 0) {
          result = "Could not find any matches. Try checking the [global](https://docs.papermc.io/paper/reference/paper-global-configuration)/[world](https://docs.papermc.io/paper/reference/world-configuration) docs or another command";
        }
        const resultEmbed = new EmbedBuilder()
          .setColor('Random')
          .setTitle(`Search results for ${args[1]} in PaperMC docs`)
          .setTimestamp()
          .setDescription(result)
          .setFooter({ text: `Requested by ${user.username}`, iconURL: user.avatarURL() });
        await message.reply({ embeds: [resultEmbed] });
      }

      else if (['purpur', 'purpurmc', 'purpurspigot'].includes(manual)) {
        const response1 = await axios.get('https://purpurmc.org/docs/Configuration');
        const html1 = response1.data;

        const $1 = cheerio.load(html1);
        const anchor = $1('h3').get().concat($1('h4').get());

        const configuration = [];
        const found = [];
        let result = '';
        const re = new RegExp(args[1], 'i');
        for (let i = 0; i < anchor.length; i++) {
          let href = $1(anchor[i]).find('a').attr('href').replace('./', '');
          const settingValue = $1(anchor[i]).next().text().trim();
          const url = `https://purpurmc.org/docs/Configuration/${href}`;
          configuration.push({ url, href });
        }


        for (let i = 0; i < configuration.length; i++) {
          if (re.test(configuration[i].href)) {
            found.push(configuration[i]);
          }
        }

        for (let i = 0; i < found.length; i++) {
          result += `\n[${found[i].href}](${found[i].url})`;
        }

        if (found.length === 0) {
          result = "Could not find any matches. Try checking the [purpur](https://purpurmc.org/docs/Configuration) docs or another command";
        }
        const resultEmbed = new EmbedBuilder()
          .setColor('Random')
          .setTitle(`Search results for ${args[1]} in PurpurMc docs`)
          .setTimestamp()
          .setDescription(result)
          .setFooter({ text: `Requested by ${user.username}`, iconURL: user.avatarURL() });

        await message.reply({ embeds: [resultEmbed] });
      }

      else if (['bukkit', 'bukkitmc'].includes(manual)) {
        const response1 = await axios.get('https://bukkit.fandom.com/wiki/Bukkit.yml');
        const html1 = response1.data;

        const $1 = cheerio.load(html1);
        const anchor = $1('h3').get().concat($1('h2').get());


        let configuration = [];
        const found = [];
        let result = '';
        const re = new RegExp(args[1], 'i');
        for (let i = 0; i < anchor.length; i++) {
          let id = $1(anchor[i]).find('.mw-headline').attr('id');
          //const settingValue = $1(anchor[i]).next().text().trim();
          const url = `https://bukkit.fandom.com/wiki/Bukkit.yml#${id}`;
          configuration.push({ url, id });
        }
        // removes null/undefined values that bukkit wiki gives
        configuration = configuration.filter(item => item.id !== null && item.id !== undefined);


        for (let i = 0; i < configuration.length; i++) {
          if (re.test(configuration[i].id)) {
            found.push(configuration[i]);
          }
        }

        for (let i = 0; i < found.length; i++) {
          result += `\n[${found[i].id}](${found[i].url})`;
        }

        if (found.length === 0) {
          result = "Could not find any matches. Try checking the [Bukkit](https://bukkit.fandom.com/wiki/Bukkit.yml) wiki or another command";
        }
        const resultEmbed = new EmbedBuilder()
          .setColor('Random')
          .setTitle(`Search results for ${args[1]} in Bukkit.yml wiki`)
          .setTimestamp()
          .setDescription(result)
          .setFooter({ text: `Requested by ${user.username}`, iconURL: user.avatarURL() });

        await message.reply({ embeds: [resultEmbed] });
      }

      else {
        // may get messy when we add more valid options
        await message.reply(`Please specify a valid manual. Valid options are \`${opts.map((o) => o.name).join('| ')} \``)
      }

    }
    catch (err) {
      client.error(err, message);

    }
  },
};