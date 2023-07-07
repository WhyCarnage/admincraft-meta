const { PermissionFlagsBits, EmbedBuilder } = require("discord.js");
module.exports = {
  name: "close",
  description: "Closes the post and marks it as solved.",
  ephemeral: true,
  args: false,
  aliases: ["solved", "s", "answered"],
  cooldown: 10,
  async execute(message, args, client) {
    const user = message?.author ?? message?.member?.user ?? message?.user;

    // prevents the command from being ran in non thread/forum post
    if (!message?.guild)
      return message.reply({
        content: "This command can only be ran in a thread/forum post!",
        ephemeral: true,
      });
    // checks if the person running command owns it or has manage threads perms
    if (
      message.channel.ownerId != message.member.id &&
      !message.member.permissions.has(PermissionFlagsBits.ManageThreads)
    )
      return message.reply({
        content: "Only moderators and the Post owner can close this post",
        ephemeral: true,
      });
    // creates embed
    const solvedEmbed = new EmbedBuilder()
      .setColor("Random")
      .setTitle("Closed post!")
      .setDescription(`Your post has been marked as solved!`)
      .setFooter({
        text: `Requested by ${user.username}#${user.discriminator}`,
        iconURL: user.avatarURL(),
      })
      .setTimestamp();
    const closeEmbed = new EmbedBuilder()
      .setColor("Random")
      .setTitle("post closed!")
      .setDescription(`The post/thread has been closed!`)
      .setFooter({
        text: `Requested by ${user.username}#${user.discriminator}`,
        iconURL: user.avatarURL(),
      })
      .setTimestamp();

    // reply with embed
    try {
      // fetches the post and marks it as solved
      const postMessage = await message.channel.fetch(message.targetId);
      const availableTags = message.channel.parent.availableTags;
      // dynamically gets the solved tag id

      // checks if the bot has perms to modify the post
      if (
        !message.channel
          .permissionsFor(message.guild.members.me)
          .has(PermissionFlagsBits.ManageThreads)
      ) {
        return await message.reply(
          "I cannot modify this post as i don't have permission to do so!"
        );
      }
      // gets the solved tag id  without the need to hardcode an id
      const solvedTag = await availableTags?.find(
        (t) => t.name.toLowerCase() == "solved"
      )?.id;
      // checks if the solved tag exists and if it does apply it
      if (solvedTag) {
        await postMessage.setAppliedTags(
          [solvedTag],
          "Marked as solved By " + user.username + "#" + user.discriminator
        );
      }
      // checks if the post is archived or not. if it it isn't, it will reply with the embed and archive the post
      if (!message.channel.archived) {
        if (message.channel.parent.name != "questions")  {
        await message
          .reply({ embeds: [solvedEmbed] })
          .then(
            async () =>
              await postMessage.setArchived(
                true,
                "Marked as solved By " + user.tag
              )
          );
              } else { 
                await message
                .reply({ embeds: [closeEmbed] })
                .then(
                  async () =>
                    await postMessage.setArchived(
                      true,
                      `${user.tag}#${user.discriminator} closed the post`
                    )
                );
      
              }
      }
    } catch (err) {
      client.error(err, message);
    }
  },
};
