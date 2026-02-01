const { ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } = require("discord.js");
const moment = require("moment");
require("moment-timezone");
const allWords = require("../../../data/words.json");

const ötbetűSchema = require("../../../models/ötbetűModel.js");
const saspontSchema = require("../../../models/saspontModel.js");

module.exports = {
    name: "szóharc",
    description: "Epikus szóharc",
    info: "Állítsd csatába legerősebb szavadat, és derüljön ki, kinek erősebb a szava!",
    options: [
        {
            name: "játék",
            description: "Epikus szóharc",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "szó",
                    description: "A harcba állított szavad",
                    type: ApplicationCommandOptionType.String,
                    required: true
                }
            ]
        },
        {
            name: "súgó",
            description: "Játékszabályok megjelenítése",
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async (client, interaction) => {

        const subCommand = interaction.options.getSubcommand();
        const szo = interaction.options.getString("szó")?.toLowerCase().split(" ")[0];
        const ötbetűData = await ötbetűSchema.findOne();
        let player = ötbetűData.Users.find(x => x.UserID == interaction.user.id);
        const saspontData = await saspontSchema.findOne();
        let saspontUser = saspontData.Users.find(x => x.UserID == interaction.user.id);

        const format = new Intl.NumberFormat("hu-HU", { useGrouping: true, minimumGroupingDigits: 1 });

        if (subCommand === "súgó") {
            const ruleContainer = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent("### Játékmenet\n- Adj meg egy tetszőleges szót, majd sasBot is kiválaszt egyet\n- A szavakra pontok kaphatóak, az nyer, akinek több pontja lesz!\n### Pontozás\n- a szó karakterhosszával megegyező pont\n- `+5` pont ismétlődő betűnként\n- `+10` pont ritka karakter használatáért\n- `*2` a kitalált nap szava használatáért"));

            return interaction.reply({ components: [ruleContainer], flags: MessageFlags.IsComponentsV2 });
        }

        if (subCommand === "játék") {
            if (!allWords.includes(szo)) return interaction.reply({ content: "Létező szót adj meg!", flags: MessageFlags.Ephemeral });

            const finalWord = Math.floor(Math.random() * allWords.length);

            const countCharacters = (str) => {
                const chars = [];
                let sameCharScore = 0;

                for (let char of str) {
                    if (chars.includes(char)) sameCharScore += 5;
                    else chars.push(char);
                }

                return sameCharScore;
            }

            const specialCharacters = (str) => {
                const specChars = ["q", "w", "x"];
                let specCharScore = 0;
                const hasSpecChar = specChars.some(elem => str.includes(elem));

                hasSpecChar ? specCharScore = 10 : 0;

                return specCharScore;
            }

            const isWordOfTheDay = (str) => {
                let wordOfTheDayMult = 1;

                if (ötbetűData.Word === str && player && player.Guessed) wordOfTheDayMult = 2;

                return wordOfTheDayMult;
            }

            const botWord = allWords[finalWord];

            const userScore = (countCharacters(szo) + specialCharacters(szo) + szo.length) * isWordOfTheDay(szo);
            const botScore = (countCharacters(botWord) + specialCharacters(botWord) + botWord.length) * isWordOfTheDay(botWord);

            const szoharcContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Szóharc: \`${interaction.user.displayName}\` vs. \`${client.user.username}\``))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`\`${szo}\`: **${userScore} pont** (${szo.length}+${countCharacters(szo)}+${specialCharacters(szo)}\\*${isWordOfTheDay(szo)})\tvs.\t\`${botWord}\`: **${botScore} pont** (${botWord.length}+${countCharacters(botWord)}+${specialCharacters(botWord)}\\*${isWordOfTheDay(botWord)})`));

            const saspontTextComponent = new TextDisplayBuilder();

            if (userScore > botScore) {
                saspontUser.Balance += userScore * 2;
                saspontUser.History.push({
                    Value: userScore * 2,
                    Origin: "Szóharc",
                    Guild: interaction.channel.type === 1 ? "DM" : interaction.guild.name,
                    Date: moment().tz("Europe/Budapest").format("YYYY-MM-DD HH:mm")
                });

                await saspontData.save();

                saspontTextComponent.setContent(`-# +${format.format(userScore * 2)} sasPont`);

                szoharcContainer
                .setAccentColor(0x19cc10)
                .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
                .addTextDisplayComponents(saspontTextComponent);
            } else if (userScore < botScore) {
                saspontTextComponent.setContent("-# +0 sasPont");

                szoharcContainer
                .setAccentColor(0xe2162e)
                .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
                .addTextDisplayComponents(saspontTextComponent);
            } else {
                saspontTextComponent.setContent("-# +0 sasPont");

                szoharcContainer
                .setAccentColor(0x3d3d3d)
                .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
                .addTextDisplayComponents(saspontTextComponent);
            }

            interaction.reply({ components: [szoharcContainer], flags: MessageFlags.IsComponentsV2 });
        }
    }
}