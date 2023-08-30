const analyzeTimings = require("../functions/analyzeTimings");
const analyzeProfile = require("../functions/analyzeProfile");
const fs = require("fs");
const fetch = (...args) =>
  import("node-fetch").then(({ default: e }) => e(...args));
const {
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

// used to detect offline mode via warning messages
const offlineModeRegex = [
  /server is running in offline\/insecure mode/i,
  /the server will make no attempt to authenticate usernames/i,
  /while this makes the game possible to play without internet access/i,
  /it also opens up the ability for hackers to connect with any username they choose/i,
  /you will not be offered any support as long as the server allows offline-mode players to join/i,
  /to change this, set "online-mode" to "true" in the server\.properties file/i,
];
// detects player name but most importantly their uuid. Offline mode uses uuidv3 whereas online mode uses uuidv4
const uuidRegex =
  /UUID of player (.+?) is ([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/;

let offlineMode = false;

module.exports = async (client, message) => {
  if (message.type == 6 && message.author.id === client.user.id) {
    await message.delete();
  }
  if (message.author.bot) return;

  // If the bot can't read message history or send messages, don't execute a command
  //if (message.guild && (!message.guild.members.me.permissionsIn(message.channel).has(PermissionsBitField.Flags.SendMessages) || !message.guild.members.me.permissionsIn(message.channel).has(PermissionsBitField.Flags.ReadMessageHistory))) return;

  // make a custom function to replace message.reply
  // this is to send the message to the channel without a reply if reply fails
  message.msgreply = message.reply;
  message.reply = function reply(object) {
    return message.msgreply(object).catch((err) => {
      client.logger.warn(err);
      return message.channel.send(object).catch((err) => {
        client.logger.error(err.stack);
      });
    });
  };

  // Get the prefix
  let prefix = process.env.PREFIX;

  try {
    // checks if theres an attachment to the message
    if (message.attachments.size > 0) {
      // needed to check if the message will need to be deleted at the end of the loop
      shall_delete = false;

      // create the embed
      const PasteEmbed = new EmbedBuilder()
        .setTitle(
          "We have uploaded your file to a paste service for better readability"
        )
        .setColor(0x1d83d4)
        .setDescription(
          "Paste services are more mobile friendly and easier to read than just posting a file"
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.avatarURL(),
        });

      // Discord deprecated .addfield so we need to create an array to store the fields before adding them to the embed
      let fields = [];

      // loop through all the attachments
      for (const attachment of message.attachments.values()) {
        // get the url of the attachment
        const url = attachment.url;
        // list of filetypes that are allowed to be uploaded
        const filetypes = [
          ".log",
          ".txt",
          ".json",
          ".yml",
          ".yaml",
          ".css",
          ".py",
          ".js",
          ".sh",
          ".config",
          ".conf",
          ".properties",
        ];
        // list of executables that are not allowed to be uploaded
        const executables = [
          ".exe",
          ".app",
          ".dmg",
          ".pkg",
          ".deb",
          ".rpm",
          ".jar",
          ".bat",
          ".sh",
          ".cmd",
          ".msi",
        ];

        // ignore html although to be honest idk why anyone would upload a html file
        if (!url.endsWith(".html")) {
          let parts = url.split(".");
          const filetype =
            message.attachments.first().contentType?.split("/")[0] ||
            parts[parts.length - 1];
          if (
            (filetypes.some((ext) => url.endsWith(ext)) ||
              filetype == "text") &&
            (!executables.some((ext) => url.endsWith(ext)) ||
              filetype == "application")
          ) {
            // Start typing
            await message.channel.sendTyping();

            // fetch the file from the external URL
            let text = await fetch(url).then((res) => {
              return res.text();
            });

            //  if the string is too long, truncate it. the api does not accept files over 10mb
            let truncated = false;
            if (text.length > 10 * 1024 * 1024) {
              text = text.substring(0, 10 * 1024 * 1024);
              truncated = true;
            }
            let response = await fetch("https://api.mclo.gs/1/log", {
              method: "POST",
              body: `content=${encodeURIComponent(text)}`,
              headers: { "content-type": "application/x-www-form-urlencoded" },
            })
              .then((res) => res.json())
              .then((data) => data["url"])
              .catch((err) => client.logger.info(err));
            if (truncated)
              response =
                response + " (file was truncated because it was over 10 mb)";

            fields.push({
              name: attachment.name,
              value: response,
              inline: false,
            });

            // offline mode detection
            for (const regex of offlineModeRegex) {
              if (regex.test(text)) {
                offlineMode = true;
                break;
              }
            }
            // uuid detection
            const uuidMatch = text.match(uuidRegex);
            const uuid = uuidMatch?.[2];
            if (uuid) {
              uuid.charAt(14) == "3"
                ? (offlineMode = true)
                : (offlineMode = false);
            }
			// TODO: add proxy detection such as bungeecord and velocity. might be difficult to do if logs don't provide the information
            if (offlineMode /* && !proxy */) {
              fields.push({
                name: "❌ Offline mode potentially detected",
                value: "This community does not support offline-mode users. If you're using a proxy",
                inline: false,
              });
            }
          }
        }
        // if the file is an executable, mark the message for deletion
        if (
          executables.some((ext) => url.endsWith(ext)) ||
          attachment.contentType?.split("/")[0] == "application"
        ) {
          shall_delete = true;
        }
      }
      PasteEmbed.addFields(fields);
      if (fields.length > 0) {
        await message.reply({ embeds: [PasteEmbed] });
      }
      if (shall_delete) {
        await message
          .reply(
            "For safety reasons we do not allow executables to be sent as they might contain malware. If you're compiling for someone please DM them and as a reminder. We cannot verify if a compiled jar has not been tampered in any way"
          )
          .then(async () => {
            await message.delete();
          });
      }
    }

    // Pastebin is blocked in some countries
    const words = message.content.replace(/\n/g, " ").split(" ");
    for (const word of words) {
      if (word.startsWith("https://pastebin.com/") && word.length == 29) {
        // Start typing
        await message.channel.sendTyping();

        const key = word.split("/")[3];
        const res = await fetch(`https://pastebin.com/raw/${key}`);
        let text = await res.text();

        //  if the string is too long, truncate it. the api does not accept files over 10mb
        let truncated = false;
        if (text.length > 10 * 1024 * 1024) {
          text = text.substring(0, 10 * 1024 * 1024);
          truncated = true;
        }

        let response = await fetch("https://api.mclo.gs/1/log", {
          method: "POST",
          body: `content=${text}`,
          headers: { "content-type": "application/x-www-form-urlencoded" },
        })
          .then((res) => res.json())
          .then((data) => data["url"])
          .catch((err) => client.logger.info(err));
        if (truncated)
          response =
            response + "\n(file was truncated because it was over 10 mb)";

        const PasteEmbed = new EmbedBuilder()
          .setTitle("Pastebin is blocked in some countries")
          .setColor(0x1d83d4)
          .setDescription(response)
          .setFooter({
            text: `Requested by ${message.author.tag}`,
            iconURL: message.author.avatarURL(),
          });
        await message.channel.send({ embeds: [PasteEmbed] });
        client.logger.info(
          `Pastebin converted from ${message.author.tag} (${message.author.id}): ${response}`
        );
      }
    }

    // Use mention as prefix instead of prefix too
    if (message.content.replace("!", "").startsWith(`<@${client.user.id}>`))
      prefix = message.content.split(">")[0] + ">";

    // If the message doesn't start with the prefix (mention not included), check for timings/profile report
    if (!message.content.startsWith(process.env.PREFIX)) {
      const analysisresult =
        (await analyzeTimings(message, client, words)) ??
        (await analyzeProfile(message, client, words));
      if (analysisresult) {
        const analysismsg = await message.reply(analysisresult[0]);

        // Get the issues from the analysis result
        const issues = analysisresult[1];
        if (issues) {
          const filter = (i) =>
            i.user.id == message.author.id &&
            i.customId.startsWith("analysis_");
          const collector = analysismsg.createMessageComponentCollector({
            filter,
            time: 300000,
          });
          collector.on("collect", async (i) => {
            // Defer button
            i.deferUpdate();

            // Get the embed
            const AnalysisEmbed = new EmbedBuilder(
              i.message.embeds[0].toJSON()
            );
            const footer = AnalysisEmbed.toJSON().footer;

            // Force analysis button
            if (i.customId == "analysis_force") {
              const fields = [...issues];
              const components = [];
              if (issues.length >= 13) {
                fields.splice(12, issues.length, {
                  name: "✅ Your server isn't lagging",
                  value: `**Plus ${
                    issues.length - 12
                  } more recommendations**\nClick the buttons below to see more`,
                });
                components.push(
                  new ActionRowBuilder().addComponents([
                    new ButtonBuilder()
                      .setCustomId("analysis_prev")
                      .setEmoji({ name: "⬅️" })
                      .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                      .setCustomId("analysis_next")
                      .setEmoji({ name: "➡️" })
                      .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                      .setURL(
                        "https://github.com/Darkcarnage23/admincraft-meta"
                      )
                      .setLabel("source")
                      .setStyle(ButtonStyle.Link),
                  ])
                );
              }
              AnalysisEmbed.setFields(fields);

              // Send the embed
              return analysismsg.edit({ embeds: [AnalysisEmbed], components });
            }

            // Calculate total amount of pages and get current page from embed footer
            const text = footer.text.split(" • ");
            const lastPage = parseInt(
              text[text.length - 1].split("Page ")[1].split(" ")[0]
            );
            const maxPages = parseInt(
              text[text.length - 1].split("Page ")[1].split(" ")[2]
            );

            // Get next page (if last page, go to pg 1)
            const page =
              i.customId == "analysis_next"
                ? lastPage == maxPages
                  ? 1
                  : lastPage + 1
                : lastPage - 1
                ? lastPage - 1
                : maxPages;
            const end = page * 12;
            const start = end - 12;
            const fields = issues.slice(start, end);

            // Update the embed
            text[text.length - 1] = `Page ${page} of ${Math.ceil(
              issues.length / 12
            )}`;
            AnalysisEmbed.setFields(fields).setFooter({
              iconURL: footer.iconURL,
              text: text.join(" • "),
            });

            // Send the embed
            analysismsg.edit({ embeds: [AnalysisEmbed] });
          });
        }
      }
    }
  } catch (err) {
    client.logger.error(err.stack);
  }

  // If message doesn't start with the prefix, if so, return
  if (!message.content.startsWith(prefix)) return;

  // Get args by splitting the message by the spaces and getting rid of the prefix
  const args = message.content.slice(prefix.length).trim().split(/ +/);

  // Get the command name from the fist arg and get rid of the first arg
  const commandName = args.shift().toLowerCase();

  // Get the command from the commandName, if it doesn't exist, return
  const command =
    client.commands.get(commandName) ||
    client.commands.find(
      (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
    );

  // If the command doesn't exist, find timings report
  if (!command || !command.name) return;

  // Start typing (basically to mimic the defer of interactions)
  await message.channel.sendTyping();

  // Check if args are required and see if args are there, if not, send error
  if (command.args && args.length < 1) {
    const Usage = new EmbedBuilder()
      .setColor(0x5662f6)
      .setTitle("Usage")
      .setDescription(`\`${prefix + command.name + " " + command.usage}\``);
    return message.reply({ embeds: [Usage] });
  }

  // execute the command
  try {
    client.logger.info(
      `${message.author.tag} issued message command: ${message.content}, in ${
        message?.guild?.name ??
        message.author.username + `#${message.author.discriminator}` + ` (DMs)`
      } `
    );
    command.execute(message, args, client);
  } catch (err) {
    const interactionFailed = new EmbedBuilder()
      .setColor("Random")
      .setTitle("INTERACTION FAILED")
      .setAuthor({
        name: message.author.tag,
        iconURL: message.author.avatarURL(),
      })
      .addFields([
        { name: "**Type:**", value: "Message" },
        { name: "**Guild:**", value: message?.guild?.name ?? "None" },
        {
          name: "**Channel:**",
          value:
            message?.channel?.name ??
            `${message.author?.username}#${message?.author?.discriminator} (DM)`,
        },
        { name: "**INTERACTION:**", value: prefix + command.name },
        { name: "**Error:**", value: `\`\`\`\n${err}\n\`\`\`` },
      ]);

    // Send the error to the user
    message.author
      .send({ embeds: [interactionFailed] })
      .catch((err) => client.logger.warn(err));
    client.logger.error(err.stack);
  }
};
