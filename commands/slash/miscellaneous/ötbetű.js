import { ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import moment from "moment";
import "moment-timezone";
import allWords from "../../../data/words.json" with { type: "json" };
import dailyOtbetuSchema from "../../../models/dailyOtbetuModel.js";
import userOtbetuSchema from "../../../models/userOtbetuModel.js";
import saspontSchema from "../../../models/saspontModel.js";

export default {
    name: "ötbetű",
    description: "Találd ki a szót!",
    info: "Találd ki a naponta változó 5 betűs szót legfeljebb 6 próbából.",
    options: [
        {
            name: "játék",
            description: "Találd ki a nap szavát!",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "szó",
                    description: "5 betűs szó, amivel játszol",
                    type: ApplicationCommandOptionType.String,
                    required: true,
                    minLength: 5,
                    maxLength: 5
                }
            ]
        },
        {
            name: "statisztikák",
            description: "Az eddigi elért eredmények megjelenítése",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "súgó",
            description: "Játékszabályok megjelenítése",
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async (client, interaction) => {

        const subCommand = interaction.options.getSubcommand();
        const guess = interaction.options.getString("szó");
        const dailyOtbetuData = await dailyOtbetuSchema.findOne();
        const saspontData = await saspontSchema.findOne({ UserID: interaction.user.id });
        let userOtbetuData = await userOtbetuSchema.findOne({ UserID: interaction.user.id });

        const format = new Intl.NumberFormat("hu-HU", { useGrouping: true, minimumGroupingDigits: 1 });
        const base = client.config.otbetuSaspontBase || 500;

        if (subCommand === "játék") {
            if (!allWords.includes(guess) || guess.length < 5) return interaction.reply({ content: "Egy létező, 5 betűs szót adj meg!", flags: MessageFlags.Ephemeral });

            if (!userOtbetuData) {
                const newData = new userOtbetuSchema({
                    UserID: interaction.user.id,
                    Today: {
                        Tries: 1,
                        Guessed: false,
                        Sequence: null
                    },
                    Stats: {
                        GamesPlayed: 1,
                        Wins: 0,
                    },
                    BestGame: {
                        Tries: null,
                        Date: null
                    }
                });
                await newData.save();

                userOtbetuData = userOtbetuSchema.findOne({ UserID: interaction.user.id });
            } else {
                if (userOtbetuData.Today.Tries >= 6) return interaction.reply({ content: "Ma már játszottál! Új szó éjfélkor!", flags: MessageFlags.Ephemeral });

                userOtbetuData.Today.Tries += 1;

                if (userOtbetuData.Today.Tries === 1) userOtbetuData.Stats.GamesPlayed += 1;

                await userOtbetuData.save();
            }

            const charCountOfWord = {};
            for (const char of dailyOtbetuData.Word) {
                charCountOfWord[char] = (charCountOfWord[char] || 0) + 1;
            }

            let results = "";
            for (let i = 0; i < 5; i++) {
                if (guess[i] == dailyOtbetuData.Word[i]) {
                    results += "🟩";
                    charCountOfWord[guess[i]] -= 1;
                } else if (dailyOtbetuData.Word.includes(guess[i]) && charCountOfWord[guess[i]] > 0) {
                    results += "🟧";
                    charCountOfWord[guess[i]] -= 1;
                } else {
                    results += "⬛"
                }
            }

            const hasWon = guess === dailyOtbetuData.Word;

            if (userOtbetuData.Today.Sequence) userOtbetuData.Today.Sequence += "\n" + [...results].join("  ");
            else userOtbetuData.Today.Sequence = [...results].join("  ");
            
            await userOtbetuData.save();
    
            const otbetuContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Ötbetű: <t:${Math.floor(Date.now() / 1000)}:D> \`${userOtbetuData.Today.Tries}/6\``))
            .addSeparatorComponents(new SeparatorBuilder());

            userOtbetuData.Today.Sequence.split(/\r?\n/).forEach(line => {
                otbetuContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(line));
            });

            otbetuContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${guess.split("").map(char => `\`${char}\``).join("\t")}`));

            if (userOtbetuData.Today.Tries === 6 && !hasWon) {
                otbetuContainer
                .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`A nap szava: \`${dailyOtbetuData.Word}\``))
                .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`${userOtbetuData.Streak > 0 ? `-# ${userOtbetuData.Streak} napos Streak elvesztve!\n` : ""}-# +0 sasPont`));

                userOtbetuData.Streak = 0;
                await userOtbetuData.save();
            }

            if (hasWon) {
                userOtbetuData.Streak += 1;
                const earnedPoints = base * (7 - userOtbetuData.Today.Tries) + 50 * userOtbetuData.Streak;

                if (saspontData.Games.Otbetu.MaxWin < earnedPoints) saspontData.Games.Otbetu.MaxWin = earnedPoints
                
                saspontData.Balance += earnedPoints;
                saspontData.History.push({
                    Value: earnedPoints,
                    Origin: "Ötbetű",
                    Guild: interaction.channel.type === 1 ? "DM" : interaction.guild.name,
                    Date: moment().tz("Europe/Budapest").format("YYYY-MM-DD HH:mm")
                });

                await saspontData.save();

                if (userOtbetuData.Today.Tries < userOtbetuData.BestGame.Tries || userOtbetuData.BestGame.Tries === null) {
                    userOtbetuData.BestGame.Tries = userOtbetuData.Today.Tries;
                    userOtbetuData.BestGame.Date = moment().tz("Europe/Budapest").format("YYYY-MM-DD");
                }

                otbetuContainer
                .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# +${format.format(base * (7 - userOtbetuData.Today.Tries))} sasPont (${userOtbetuData.Today.Tries} találatból)${(userOtbetuData.Streak > 0 ? `\n-# +${format.format(50 * userOtbetuData.Streak)} sasPont (Streak ${userOtbetuData.Streak})` : "")}`));

                userOtbetuData.Today.Guessed = true;
                userOtbetuData.Stats.Wins += 1;
                userOtbetuData.Today.Tries = 6;
                userOtbetuData.LastWonOn = moment().tz("Europe/Budapest").startOf('day').toDate();

                await userOtbetuData.save();
            }
            
            interaction.reply({ components: [otbetuContainer], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
        }

        if (subCommand === "statisztikák") {
            if (!userOtbetuData) return interaction.reply({ content: "Még egy játékot sem játszottál!", flags: MessageFlags.Ephemeral });
    
            const statsContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Ötbetű statisztikák: \`${interaction.user.username}\``))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Streak:** \`${userOtbetuData.Streak}\`\n- **Játékok:** \`${userOtbetuData.Stats.GamesPlayed}\`\n- **Kitalálások:** \`${userOtbetuData.Stats.Wins}\`\n- **Legjobb játék:** ${userOtbetuData.BestGame.Tries == null ? "nincs" : `\n    - **Próbák:** \`${userOtbetuData.BestGame.Tries}\`\n   - **Dátum:** \`${userOtbetuData.BestGame.Date}\``}`));
            
            interaction.reply({ components: [statsContainer], flags: MessageFlags.IsComponentsV2 });
        }

        if (subCommand === "súgó") {
            const ruleContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Játékmenet\n- Adj meg egy öt betűs magyar szót, hogy megtudd melyik betűk szerepelnek a nap szavában!\n- Találd ki legfeljebb 6 próbából ezt a szót!\n- Minél kevesebb próbálkozásból kitalálod a szót, annál több sasPontot kapsz!\n- Ha mindennap helyesen kitalálod, akkor még több sasPontot kaphatsz!\n### Színek jelentése\n- ⬛: a betű nincs benne a szóban\n- 🟧: a betű benne van a szóban, de rossz helyen\n- 🟩: a betű benne van a szóban és jó helyen"));

            interaction.reply({ components: [ruleContainer], flags: MessageFlags.IsComponentsV2 });
        }
    }
}