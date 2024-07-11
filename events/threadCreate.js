const { EmbedBuilder } = require("discord.js");
module.exports = async (client, thread) => {
  // fetches the parent channel of the thread
  parent = thread.guild.channels.cache.get(thread.parentId);
  if (parent.name != "questions") return; // stops if the parent channel is not a question channel
  const owner =
    (await client.users.cache.get(thread.ownerId)) ||
    (await client.users.fetch(thread.ownerId));
  const embed = new EmbedBuilder()
    .setTitle("Thanks for asking your question!")
    .setTimestamp()
    .setColor("Random")
    .setDescription(
      "Make sure to provide as much helpful information as possible such as logs/what you tried and what your exact issue is"
    )
    .setFields({ name: "Make sure to mark solved when issue is solved!!!", value: "/close\n!close\n!solved\n!answered" })
    .setFooter({
      text: `Requested by ${owner.username}#${owner.discriminator}`,
      iconURL: owner?.avatarURL() || owner?.displayAvatarURL(),
    });

  // we need a delay here as sometimes the thread isn't available for the bot to send a message
// we need a delay here as sometimes the thread isn't available for the bot to send a message
new Promise((resolve) => {
  setTimeout(resolve, 1500);
})
  .then(async () => {
    const msg = await thread.send({ embeds: [embed] });
    await msg.pin();
    thread.fetchStarterMessage().then(async (message) => {
      await message.pin();
    }).catch((err) => {
      client.logger.error(err);
      setTimeout(async () => {
        try {
          const message = await thread.fetchStarterMessage();
          await message.pin();
        } catch (err) {
          client.logger.error(err);
        }
      }, 60000); 
    });
  });
};
