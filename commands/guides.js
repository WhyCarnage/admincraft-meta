const  { EmbedBuilder,ApplicationCommandOptionType } = require('discord.js');
// Temporary command 
// TODO store in database and make it so it can be editable although this out of scope for now
const guides = {
    "optimization": new  EmbedBuilder()
      .setTitle("Trouble with optimizing your server?")
      .setColor('Random')
      .setDescription("Consider reading [paper chan's guide](https://eternity.community/index.php/paper-optimization) and this [other guide](https://github.com/YouHaveTrouble/minecraft-optimization)"),
  
    "port forwarding": new  EmbedBuilder()
      .setTitle("Short guide on port forwarding")
      .setColor('Random')
      .setDescription(`
      **What is port forwarding??**
      port forwarding is a technique used to allow external services/things access the device. For example port 22 is usually open to allow SSH connections from outside the computer. Without port 22 being opened you wouldn't be able to SSH into the device. Minecraft needs certain ports open for others to be able to join.
      People will often be opening ports for various reasons such as maybe them wanting to host a website/web panel, wanting to create a database (MYSQL) and more.
  
      **How do i port forward?**
      - **hosts** usually will do port forwarding for you by default but some will either open more on request or just give you a section to open ports so check your control panel!
  
      - **Self hosted/your own device** You'd need to head to your router configuration homepage and open it. As everyone uses a different provider you'll need to search "How do i open ports on X provider" (example provider is verizon)
  
      - **VPS** will usually have something on the dashboard manager that lets you control the network security things such as what ports are open. Just google how to open port on your VPS provider.
  
      - Linux users might need to mess with [Iptables](https://www.hostinger.co.uk/tutorials/iptables-tutorial) or [ufw for ubuntu](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-firewall-with-ufw-on-ubuntu-20-04) (This guide was written for Ubuntu 20.04 so other versions may have different syntax. other linux flavours have different ways. So please do some research before blindly trying something)
  
      **How do i check if my port is open?**
      You can use this [port scanner](https://www.yougetsignal.com/tools/open-ports/) or [dnschecker's port scanner](https://dnschecker.org/port-scanner.php) which allow multiple port scans.
  
      **Please do not attempt to port forward unless you're fully aware of what it is, what it does, the dangers and how to properly do it. It'd be pretty embarrassing if you lost access to your VPS because you closed port 22**
      `),
  
    "server.properties": "https://minecraft.fandom.com/wiki/Server.properties#Java_Edition_2",
  
    "purpur": new  EmbedBuilder()
      .setTitle("PurpurMc")
      .setColor('Random')
      .setDescription(`
      Purpur is a fork of paperMc (purpur contains pufferfish, tuinity and airplane patches) which best features is the fact it has more configuration/features or ways to change Gameplay\n
      [Download](https://purpurmc.org/downloads)
      [Documentation](https://purpurmc.org/docs)
      [Github](https://github.com/PurpurMC/Purpur)
      `),
  
    "panels": new  EmbedBuilder()
      .setTitle("Server panels")
      .setColor('Random')
      .setDescription(`
      A game server management panel lets you manage your game server just through a website hosting your panel. Most hosting providers will have one but if you're self hosting or setting one up on a VPS you'll need to install one by yourself. Down below i'll list some choices but i encourage you to look into the subject yourself and choose one best for yourself
      [pterodactyl](https://pterodactyl.io/) [linux]
      [PufferPanel](https://www.pufferpanel.com/) [linux]
      [Multicraft](https://www.multicraft.org/) [linux] [windows]
      [AMP](https://cubecoders.com/AMP) [linux] [windows]
      [crafty](https://craftycontrol.com/) [linux] [windows] [mac] (uses python)
      [More found here](https://minecraftservers.fandom.com/wiki/Server_wrappers)
      `),
  
    "pufferfish": new  EmbedBuilder()
      .setTitle("Pufferfish")
      .setColor('Random')
      .setDescription(`
      Pufferfish is a fork of paperMc (pufferfish contains airplane patches) which is useful for bigger server and promises a lot of performance tweaks. Check the github for a better explanation \n
      [Download](https://ci.pufferfish.host/) (dont use pufferfish plus. its for their hosting users only)
      [Documentation](https://docs.pufferfish.host/)
      [Github](https://github.com/pufferfish-gg/Pufferfish)
      `),
  
    "paper": new  EmbedBuilder()
      .setTitle("PaperMC")
      .setColor('Random')
      .setDescription(`
      Paper is a fork of Spigot (paper contains tuinity patches too!) which is recommended to use since it gives 2x the performance you get with spigot although it may have unwanted features as it also promises to fix a ton of bugs\n
      [Download](https://papermc.io/downloads)
      [Documentation](https://docs.papermc.io/)
      [Github](https://github.com/PaperMC/Paper)
      `),
  
    "spigot": new  EmbedBuilder()
      .setTitle("SpigotMC")
      .setColor('Random')
      .setDescription(`
      SpigotMc is a fork of bukkit which is the base of all the other forks you heard of such as paper. When a new version comes out you'll see this one being updated first\n
      [no downloads available, must compile using buildTools](https://www.spigotmc.org/wiki/buildtools/)
      [Documentation](https://www.spigotmc.org/wiki/spigot-configuration/)
      [github](https://github.com/spigotmc/)
      `),
  
    "bukkit": "https://bukkit.fandom.com/wiki/Bukkit.yml",
  
    "hilltty flags": "https://github.com/hilltty/hilltty-flags/blob/main/english-lang.md",
  
    "aikar flags": "https://aikar.co/mcflags.html",
  
    "offline mode": new  EmbedBuilder()
      .setTitle("Offline mode = bad")
      .setColor('Random')
      .setDescription("Offline mode is against Minecraft's [Eula](https://www.minecraft.net/en-us/eula) and provides a ton of security risks which can be read in this [blog](https://madelinemiller.dev/blog/minecraft-offline-mode). There are some legit uses such as testing/development"),
  
    "piracy": new  EmbedBuilder()
      .setTitle("Piracy smh")
      .setColor('Random')
      .setDescription("Admincraft does not tolerate nor approve of piracy in the slightest, redistributing paid for/premium plugins, cracked minecraft clients or just directly violating Minecraft's [Eula](https://www.minecraft.net/en-us/eula) by having your server in offline mode ([read here about offline mode](https://madelinemiller.dev/blog/minecraft-offline-mode)) are one of the common ways of promoting piracy."),
  
    "eula/terms": "https://www.minecraft.net/en-us/eula & https://www.minecraft.net/en-us/terms",
  
    "java/JDK": new  EmbedBuilder()
      .setTitle("Use the right java!")
      .setColor('Random')
      .setDescription(`Java and Minecraft go hand to hand, without java you wouldn't be able to run a Minecraft server so its important to have the right version installed.\n
      You should not use any of Oracle's OpenJDK below JDK 17  on your public server as it has serious licensing issues. Even if you're using above 17 its not recommended.  You should use [Adoptium](https://adoptium.net/temurin/releases) instead.\n
      **what JDK version do i need???**
         - 1.12.2 or below: Use JDK 8
         - 1.16.5: Use JDK 11
         - 1.17.1: Use JDK 16 or 17. Both work on 1.17
         - 1.18.1 or higher: Use JDK 17 \n
         __**Always use the recommended version of java rather than latest, most plugins/mods are coded against said version and other versions might not work as intended**__
      `),
  };
  C = []
  for (const [key, value] of Object.entries(guides)) {
    C.push({
      "name": key,
      "value": key,
    })
  }
  module.exports = {
	name: 'guides',
	description: "Get's useful information'",
	ephemeral: false,
	aliases: ['guide','g','info'],
	cooldown: 10,
	options:  [
		{
			'type': ApplicationCommandOptionType.String,
			'name': 'guide',
			'description': 'What guide you want to see',
			'required': true,
			'choices': C,	
		}
	],   
	async execute(message, args, client) {
		try {
      // in case of message command is being used instead of slash
      if (!args[0]) return message.reply('Please provide a guide name. \n\n**Available guides:**\n' + Object.keys(guides).join(', '));
      if (!guides[args[0]]) return message.reply('Invalid guide name. \n\n**Available guides:**\n' + Object.keys(guides).join(', '));
      const guide = guides[args[0]];
      const user = message?.author || message?.user|| message?.member
            guide.setFooter({text: `Requested by ${user.tag}`, url: user.displayAvatarURL()});
      message.reply({ embeds: [guide] });
		}
		catch (err) { client.error(err, message); }
	},
};