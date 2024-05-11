const analyzeTimings = require("../functions/analyzeTimings");
const analyzeProfile = require("../functions/analyzeProfile");
const YAML = require("yaml");
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

// detects player name but most importantly their UUID. Offline mode uses UUID v3 whereas online mode uses UUID v4
const uuidRegex =
  /UUID of player (.+?) is ([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/;

// if offline mode is detected, this will be set to true and a warning will be sent
let offlineMode = false;
// Read and parse the YAML file. This basically contains a bunch of suggestions regarding a plugin
const paperPlugins = YAML.parse(
  fs.readFileSync("./analysis_config/plugins/paper.yml", "utf8")
);

module.exports = async (client, message) => {
  // deletes the pinned message notification if the bot is the one who pinned it
  if (message.type == 6 && message.author.id === client.user.id) {
    await message.delete();
  }
  // If the message is from a bot do nothing
  if (message.author.bot) return;

  // If the bot can't read message history or send messages, don't execute a command. 
  if (message.guild && (!message.guild.members.me.permissionsIn(message.channel).has(PermissionsBitField.Flags.SendMessages) || !message.guild.members.me.permissionsIn(message.channel).has(PermissionsBitField.Flags.ReadMessageHistory))) return;

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

  // Get the prefix from the environment variables or use "!" as default
  let prefix = process.env.PREFIX || "!";

  // Discord deprecated .addfield so we need to create an array to store the fields before adding them to the embed
  let fields = [];

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


      // list of filetypes that are allowed to be uploaded
      const filetypes = [
        ".pdf",
        ".xml",
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
        ".7z",
        ".rar",
        ".tar",
        ".tar.gz",
        ".zip",
        ".exe",
        ".app",
        ".dmg",
        ".pkg",
        ".deb",
        ".rpm",
        ".jar",
        ".msi",
        "iso",

      ];

      // list of file types we want to ignore
      const ignore = ['.html', '.png', '.jpeg', '.jpg']


      // loop through all the attachments
      for (const attachment of message.attachments.values()) {
        const url = attachment?.url;

        // skip if the file is an image or html: files we don't want to process
        if (ignore.some((ext) => attachment?.name.endsWith(ext))) {
          continue;
        }
        let parts = url.split(".");

        const filetype =
          message.attachments.first().contentType?.split("/")[0] ||
          parts[parts.length - 1];

        // can't rely on the Application type so we need to check the file extension. This is due to some files such as XML return as application  
        if (
          (filetypes.some((ext) => attachment?.name.endsWith(ext)) ||
            filetype == "text") &&
          (!executables.some((ext) => attachment?.name.endsWith(ext)))
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

          // offline mode detection using regex to detect common messages in logs
          const offlineMode = offlineModeRegex.some(regex => regex.test(text) && (client.logger.info("offline mode detected because of " + regex), true));

          // uuid detection
          const uuidMatch = text.match(uuidRegex);
          const uuid = uuidMatch?.[2];
          if (uuid) {
            uuid.charAt(14) == "3"
              ? (offlineMode = true)
              : (offlineMode = false);
            client.logger.info("offline mode detected because of uuid char is " + uuid.charAt(14))
          }
          // TODO: add proxy detection such as bungeecord and velocity. might be difficult to do if logs don't provide the information
          if (offlineMode /* && !proxy */) {
            fields.push({
              name: "❌ Offline mode potentially detected",
              value:
                "This community does not support offline-mode users. If you're using a proxy please just ignore this message",
              inline: false,
            });
          }
          // Find all matches in the text ([] is a regex)
          const matches = text.match(/\[([^\]]+)\]/g);
          if (matches) {
            for (const match of matches) {
              const keyword = match.slice(1, -1); // Remove brackets
              const plugin = paperPlugins[keyword];

              if (plugin) {
                // Add a field with the YAML value found
                fields.push({
                  name: `${plugin.prefix} ${keyword}`,
                  value: plugin.value,
                });
              }
            }
          }
        }


        // if the file is an executable, mark the message for deletion
        if (
          executables.some((ext) => attachment?.name.endsWith(ext))
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


    const words = message.content.replace(/\n/g, " ").split(" ");
    for (const word of words) {
      // Pastebin is blocked in some countries so we decided to convert them too
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
          body: `content=${encodeURIComponent(text)}`,
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


        // offline mode detection
        const offlineMode = offlineModeRegex.some(regex => regex.test(text) && (client.logger.info("offline mode detected because of " + regex), true));

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
            value:
              "This community does not support offline-mode users. If you're using a proxy please just ignore this message",
            inline: false,
          });
        }
        // Find all matches in the text ([] is a regex)
        const matches = text.match(/\[([^\]]+)\]/g);
        if (matches) {
          for (const match of matches) {
            const keyword = match.slice(1, -1); // Remove brackets
            const plugin = paperPlugins[keyword];

            if (plugin) {
              // Add a field with the YAML value found
              fields.push({
                name: `${plugin.prefix} ${keyword}`,
                value: plugin.value,
              });
            }
          }
        }
        PasteEmbed.addFields(fields);
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
                  value: `**Plus ${issues.length - 12
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

  // execute the command, log it (especially what guild or dm it is in) and catch any errors 
  client.logger.info(
    `${message.author.tag} issued message command: ${message.content}, in ${message?.guild?.name ??
    message.author.username + `#${message.author.discriminator}` + ` (DMs)`
    } `
  );

  command.execute(message, args, client).catch(err => {
    client.logger.info(message)
    // Create the embed for the error message
    const interactionFailed = new EmbedBuilder()
      .setColor("#E0115F")
      .setTitle("INTERACTION FAILED")
      .setAuthor({
        name: message.author.tag,
        iconURL: message.author.avatarURL(),
      })
      .addFields([
        { name: "**Type:**", value: "Message" },
        { name: "**Location:**", value: message?.guild?.name ?? "Direct Messages" },
        {
          name: "**Channel:**",
          value: message?.channel?.name
            ? `<#${message.channel.id}> (${message.channel.name})`
            : `${message.author?.username}#${message?.author?.discriminator} (<#${message.channel?.id}>)`,
        },

        { name: "**Message:**", value: `[click here](https://discord.com/channels/${message.guild?.id ?? '@me'}/${message.channel.id}/${message.id})` },
        { name: "**INTERACTION:**", value: prefix + command.name },
        { name: "**Error:**", value: `\`\`\`\n${err}\n\`\`\`` },
      ]);

    // Error handling. Send the error to the user and log it
    message.reply({ embeds: [interactionFailed] })
      .catch((err) => client.logger.warn(err));
    client.logger.error(`${err.stack} in ${message?.guild?.name ?? message.author.username} ` + `#${message.author.discriminator}` + ` (DMs))`);
  })

};
