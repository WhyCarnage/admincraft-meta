# Admincraft's meta bot
# Credits-original code belongs to Birdflop Bot (Botflop)
- [Click here](https://discord.com/api/oauth2/authorize?client_id=787929894616825867&permissions=0&scope=bot) to invite Botflop to your server.
- [click here](https://github.com/Pemigrade/botflop) to see the source code for the original bot
-  Credited in help command too

# Current abilities

## Analyze timings reports
Paste a timings report to review an in-depth description of potential optimizations.

## Analyze timings reports and Spark profiles
Analyze a timings report or Spark profile to review an in-depth description of potential optimizations.

![Timings 1](https://user-images.githubusercontent.com/43528123/118413487-33af2300-b665-11eb-8f11-eaa4ec5a2730.png)

![Timings 2](https://user-images.githubusercontent.com/43528123/118413524-66f1b200-b665-11eb-9dbe-9b6fcfc9fccf.png)

## File upload service
The bot converts files and pastebin links into universally accessible bin links that contain multiple features such as syntax highlighting, suggestions and information censoring such as IPs.

## safeguards against executable uploads
The bot scans messages containing executable files. While the user might have good intent we can't verify the safety of the compiled file being sent publicly hence this was added. This also helps deal with potential piracy such as people uploading jars of premium plugins.

## Read The Fucking Manual (RTFM)
The bot currently can search through PaperMc, PurpurMC docs for their configuration by using web scraping.
The bot can also do bukkit.yml and hopefully others in the future.

## Guides command
An easy, way for users to find relevant guides.

## Piracy/offline mode checks
The bot can detect offline mode in logs/timings and will let the people in chat know about said items being offline/containing cracked plugins.

# setup guide
1) git clone or download this repo
2) open up a command prompt/PowerShell or use Linux's CLI and make sure you're in the area where this project is located
3) run ``npm install`` which should install all the needed modules
4) create a .env file and put ``token=Your_discord_bot's_token`` (if you haven't got one then generate one [here](https://discord.com/developers))
5) you can start the bot via ``npm run start``

<div align="center">

| :memo: hint   |
|:---------------------------|
|  You can use [pm2](https://pm2.io) to keep the bot running in background, constantly and auto restart on crash |

</div>

this bot specifically was made to help the Admincraft server so some features might not be suited for others


# Forks
You are welcome to fork this project or even use it for your use however please make sure credit is appropriately given such as the user who created the bot and that you keep in mind this bot is specifically geared towards Admincraft.