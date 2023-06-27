const { EmbedBuilder } = require("discord.js");
module.exports = async (client, thread) => {
  // fetches the parent channel of the thread
  parent = thread.guild.channels.cache.get(thread.parentId);
  if (!parent.name == "questions") return; // stops if the parent channel is not a question channel
  const owner =
    await client.users.cache.get(thread.ownerId) ||
    await client.users.fetch(thread.ownerId);
  const embed = new EmbedBuilder()
    .setTitle("Thanks for asking your question!")
    .setTimestamp()
    .setColor("Random")
    .setDescription(
      "Once you have finished, please close your thread.\nMake sure to provide as much helpful information as possible such as logs/what you tried and what your exact issue is"
    )
    .setFields({ name: "command to close", value: "/close\n!close\n!solved" })
    .setFooter({
      text: `Requested by ${owner.username}#${owner.discriminator}`, iconURL: owner?.avatarURL() || owner?.displayAvatarURL()
    });

	// we need a delay here as sometimes the thread isnt available for the bot to send a message

	new Promise(resolve => {
		setTimeout(resolve, 3000);
	  }).then(async() => {
		const msg = await thread.send({ embeds: [embed] })
		await msg.pin()

	  }).catch(err => { client.logger.error(err)})


};