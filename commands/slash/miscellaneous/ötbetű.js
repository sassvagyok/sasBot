import { ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import moment from "moment";
import "moment-timezone";
import allWords from "../../../data/words.json" with { type: "json" };
import ötbetűSchema from "../../../models/ötbetűModel.js";
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

        const ötbetűData = await ötbetűSchema.findOne();
        const saspontData = await saspontSchema.findOne();
        const subCommand = interaction.options.getSubcommand();
        const guess = interaction.options.getString("szó");
        let player = ötbetűData.Users.find(x => x.UserID == interaction.user.id);
        let saspontUser = saspontData.Users.find(x => x.UserID == interaction.user.id);

        const format = new Intl.NumberFormat("hu-HU", { useGrouping: true, minimumGroupingDigits: 1 });

        if (subCommand === "játék") {
            if (!allWords.includes(guess) || guess.length < 5) return interaction.reply({ content: "Egy létező, 5 betűs szót adj meg!", flags: MessageFlags.Ephemeral });

            if (!player) {
                const new_player = {
                    UserID: interaction.user.id,
                    Tries: 1,
                    Guessed: false,
                    Stats: {
                        Games: 1,
                        Wins: 0,
                        Best: {
                            Tries: null,
                            Date: null
                        }
                    }
                }

                ötbetűData.Users.push(new_player);
                await ötbetűData.save();
                player = ötbetűData.Users.find(x => x.UserID === interaction.user.id);
            } else {
                if (player.Tries >= 6) return interaction.reply({ content: "Ma már játszottál! Új szó éjfélkor!", flags: MessageFlags.Ephemeral });

                player.Tries += 1;

                if (player.Tries === 1) player.Stats.Games += 1;

                await ötbetűData.save();
            }

            const charCountOfWord = {};
            for (const char of ötbetűData.Word) {
                charCountOfWord[char] = (charCountOfWord[char] || 0) + 1;
            }

            let results = "";
            for (let i = 0; i < 5; i++) {
                if (guess[i] == ötbetűData.Word[i]) {
                    results += "🟩";
                    charCountOfWord[guess[i]] -= 1;
                } else if (ötbetűData.Word.includes(guess[i]) && charCountOfWord[guess[i]] > 0) {
                    results += "🟧";
                    charCountOfWord[guess[i]] -= 1;
                } else {
                    results += "⬛"
                }
            }

            const hasWon = guess === ötbetűData.Word;

            if (player.Sequence) player.Sequence += "\n" + [...results].join("  ");
            else player.Sequence = [...results].join("  ");
            
            await ötbetűData.save();
    
            const otbetuContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Ötbetű: \`${player.Tries}/6\``))
            .addSeparatorComponents(new SeparatorBuilder());

            player.Sequence.split(/\r?\n/).forEach(line => {
                otbetuContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(line));
            });

            otbetuContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${guess.split("").map(char => `\`${char}\``).join("\t")}`));

            if (player.Tries === 6 && !hasWon) {
                otbetuContainer
                .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`A nap szava: \`${ötbetűData.Word}\``))
                .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# +0 sasPont`));
            }

            if (hasWon) {
                const earnedPoints = 200 * (7 - player.Tries);

                saspontUser.Balance += earnedPoints;
                saspontUser.History.push({
                    Value: earnedPoints,
                    Origin: "Ötbetű",
                    Guild: interaction.channel.type === 1 ? "DM" : interaction.guild.name,
                    Date: moment().tz("Europe/Budapest").format("YYYY-MM-DD HH:mm")
                });

                await saspontData.save();

                if (player.Tries < player.Stats.Best.Tries || player.Stats.Best.Tries === null) {
                    player.Stats.Best.Tries = player.Tries;
                    player.Stats.Best.Date = moment().tz("Europe/Budapest").format("YYYY-MM-DD");
                }

                otbetuContainer
                .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# +${format.format(earnedPoints)} sasPont`));

                player.Guessed = true;
                player.Stats.Wins += 1;
                player.Tries = 6;

                await ötbetűData.save();
            }
            
            interaction.reply({ components: [otbetuContainer], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
        }

        if (subCommand === "statisztikák") {
            if (!player) return interaction.reply({ content: "Még egy játékot sem játszottál!", flags: MessageFlags.Ephemeral });
    
            const statsContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Ötbetű statisztikák: \`${interaction.user.displayName}\``))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Játékok:** \`${player.Stats.Games}\`\n- **Kitalálások:** \`${player.Stats.Wins}\`\n- **Legjobb játék:** ${player.Stats.Best.Tries == null ? "nincs" : `\n    - **Próbák:** \`${player.Stats.Best.Tries}\`\n   - **Dátum:** \`${player.Stats.Best.Date}\``}`));
            
            interaction.reply({ components: [statsContainer], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
        }

        if (subCommand === "súgó") {
            const ruleContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Játékmenet\n- Adj meg egy öt betűs magyar szót, hogy megtudd melyik betűk szerepelnek a nap szavában!\n- Találd ki legfeljebb 6 próbából ezt a szót!\n### Színek jelentése\n- ⬛: a betű nincs benne a szóban\n- 🟧: a betű benne van a szóban, de rossz helyen\n- 🟩: a betű benne van a szóban, jó helyen"));

            interaction.reply({ components: [ruleContainer], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
        }
    }
}