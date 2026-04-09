import { ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import moment from "moment";
import "moment-timezone";
import allWords from "../../../data/words.json" with { type: "json" };
import otbetuSchema from "../../../models/ötbetűModel.js";
import saspontSchema from "../../../models/saspontModel.js";
import szoharcSchema from "../../../models/szóharcModel.js";

export default {
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
        const userWord = interaction.options.getString("szó")?.toLowerCase().split(" ")[0];
        const otbetuData = await otbetuSchema.findOne();
        let otbetuPlayer = otbetuData.Users.find(x => x.UserID === interaction.user.id);
        const saspontData = await saspontSchema.findOne();
        let saspontUser = saspontData.Users.find(x => x.UserID === interaction.user.id);
        let szoharcData  = await szoharcSchema.findOne();
        if (!szoharcData) {
            const newData = new szoharcSchema({
                Users: [
                    {
                        UserID: interaction.user.id,
                        RecentWords: []
                    }
                ]
            });
            await newData.save();
            szoharcData = newData;
        }
        let szoharcPlayer = szoharcData.Users.find(x => x.UserID === interaction.user.id);

        const format = new Intl.NumberFormat("hu-HU", { useGrouping: true, minimumGroupingDigits: 1 });

        if (subCommand === "súgó") {
            const ruleContainer = new ContainerBuilder().addTextDisplayComponents(new TextDisplayBuilder().setContent("### Játékmenet\n- Adj meg egy tetszőleges szót, majd sasBot is kiválaszt egyet\n- A szavakra pontok kaphatóak, az nyer, akinek több pontja lesz!\n### Pontozás\n- a szó karakterhosszával megegyező pont\n- `+5` pont ismétlődő betűnként\n- `+10` pont ritka karakter használatáért\n- `*2` a kitalált nap szava használatáért"));

            return interaction.reply({ components: [ruleContainer], flags: MessageFlags.IsComponentsV2 });
        }

        if (subCommand === "játék") {
            if (!allWords.includes(userWord)) return interaction.reply({ content: "Létező szót adj meg!", flags: MessageFlags.Ephemeral });

            if (!szoharcPlayer) {
                const new_player = {
                    UserID: interaction.user.id,
                    RecentWords: []
                }

                szoharcData.Users.push(new_player);
                await szoharcData.save();
                szoharcPlayer = szoharcData.Users.find(x => x.UserID === interaction.user.id);
            }

            if (szoharcPlayer.RecentWords.includes(userWord)) return interaction.reply({ content: "Ezzel a szóval nemrég játszottál! Játsz valami mással!", flags: MessageFlags.Ephemeral });

            szoharcPlayer.RecentWords.push(userWord);
            if (szoharcPlayer.RecentWords.length > 10) szoharcPlayer.RecentWords.shift();
            await szoharcData.save();

            const sameCharacters = (str) => {
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

                if (otbetuData.Word === str && otbetuPlayer && otbetuPlayer.Guessed) wordOfTheDayMult = 2;

                return wordOfTheDayMult;
            }

            const randomIndex = Math.floor(Math.random() * allWords.length);
            const myWord = allWords[randomIndex];

            const userScore = (sameCharacters(userWord) + specialCharacters(userWord) + userWord.length) * isWordOfTheDay(userWord);
            const botScore = (sameCharacters(myWord) + specialCharacters(myWord) + myWord.length) * isWordOfTheDay(myWord);

            const szoharcContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Szóharc: \`${interaction.user.displayName}\` vs. \`${client.user.username}\``))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`\`${userWord}\`: **${userScore} pont** ((${userWord.length}+${sameCharacters(userWord)}+${specialCharacters(userWord)})\\*${isWordOfTheDay(userWord)})\tvs.\t\`${myWord}\`: **${botScore} pont** ((${myWord.length}+${sameCharacters(myWord)}+${specialCharacters(myWord)})\\*${isWordOfTheDay(myWord)})`));

            const saspontTextComponent = new TextDisplayBuilder();

            if (userScore > botScore) {
                saspontUser.Balance += userScore * 5;
                saspontUser.History.push({
                    Value: userScore * 5,
                    Origin: "Szóharc",
                    Guild: interaction.channel.type === 1 ? "DM" : interaction.guild.name,
                    Date: moment().tz("Europe/Budapest").format("YYYY-MM-DD HH:mm")
                });

                await saspontData.save();

                saspontTextComponent.setContent(`-# +${format.format(userScore * 5)} sasPont`);

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