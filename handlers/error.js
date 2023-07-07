const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = (client) => {
  // Create a function for error messaging
  client.error = async function error(err, message, userError) {
    const issue_url =  `${process.env.GITHUB_URL}/issues/new?labels=bug&projects=&template=bug-report.md&title=%5BBug%5D+Bug_name`
    
    if (`${err}`.includes("Received one or more errors")) console.log(err);
    err = err.stack ?? err;
    client.logger.error(err);

    const errEmbed = new EmbedBuilder()
      .setColor(0xe74c3c)
      .setTitle("An error has occurred!")
      .setDescription(`\`\`\`\n${err}\n\`\`\``);
    const row = [];

    if (!userError) {
      errEmbed.setFooter({
        text: "This was most likely an error on our end. Please report this at the github",
      });
      row.push(
        new ActionRowBuilder().addComponents([
          new ButtonBuilder()
            .setURL(issue_url)
            .setLabel("report this issue via github")
            .setStyle(ButtonStyle.Link),
        ])
      );
    }
    message.reply({ embeds: [errEmbed], components: row }).catch((err) => {
      client.logger.warn(err);
      message.channel
        .send({ embeds: [errEmbed], components: row })
        .catch((err) => client.logger.warn(err));
    });
  };
  client.rest.on("rateLimited", (info) => {
    client.logger.warn(`Encountered ${info.method} rate limit!`)
	client.logger.warn(JSON.stringify(info))
  }
  );
  process.on("unhandledRejection", (reason) => {
    if (
      reason.rawError &&
      (reason.rawError.message == "Unknown Message" ||
        reason.rawError.message == "Unknown Interaction" ||
        reason.rawError.message == "Missing Access" ||
        reason.rawError.message == "Missing Permissions")
    ) {
      client.logger.error(JSON.stringify(reason.requestBody));
    }
  });
  client.logger.info("Error Handler Loaded");
};
