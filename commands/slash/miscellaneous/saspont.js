import { ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import saspontSchema from "../../../models/saspontModel.js";
import moment from "moment";
import"moment-timezone";

export default {
    name: "saspont",
    description: "sasPont parancsok",
    info: "Nézd meg a saját vagy kiválasztott tag sasPont adatait, a globális/szerver ranglistát, vagy lépj be a kaszinóba.",
    options: [
        {
            name: "adatok",
            description: "Saját vagy megadott tag sasPont adatai",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "tag",
                    description: "Tag, akinek az adatait meg akarod nézni (üres: saját adatok)",
                    type: ApplicationCommandOptionType.User,
                    required: false
                }
            ]
        },
        {
            name: "ranglista",
            description: "Legjobb 10 sasPont gyűjtő megjelenítése",
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: "globális",
                    description: "Globális ranglista megjelenítése",
                    type: ApplicationCommandOptionType.Subcommand
                },
                {
                    name: "szerver",
                    description: "Szerver ranglistájának megjelenítése",
                    type: ApplicationCommandOptionType.Subcommand
                }
            ]
        },
        {
            name: "casino",
            description: "Sokszorozd meg sasPontjaidat!",
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: "crash",
                    description: "Kiszállsz vagy maradsz nagyobb szorzó reményében?",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "tét",
                            description: "Mennyi sasPonttal játszol?",
                            type: ApplicationCommandOptionType.Number,
                            minValue: 50,
                            required: true
                        }
                    ]
                },
                {
                    name: "coinflip",
                    description: "Fej vagy írás? Duplázd meg a tétedet ennek eltalálásával!",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "tét",
                            description: "Mennyi sasPonttal játszol?",
                            type: ApplicationCommandOptionType.Number,
                            minValue: 50,
                            required: true
                        },
                        {
                            name: "oldal",
                            description: "Mire fogadsz?",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            choices: [
                                {
                                    name: "Fej",
                                    value: "fej"
                                },
                                {
                                    name: "Írás",
                                    value: "írás"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            name: "súgó",
            description: "Súgó a sasPont-rendszer működéséhez",
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async (client, interaction) => {

        const saspontData = await saspontSchema.findOne();
        const subCommandGroup = interaction.options.getSubcommandGroup();
        const subCommand = interaction.options.getSubcommand();
        const user = interaction.channel.type === 1 ? interaction.user : interaction.options.getUser("tag") || interaction.user;
        const format = new Intl.NumberFormat("hu-HU", { useGrouping: true, minimumGroupingDigits: 1 });

        const sortFunction = (a, b) => {
            return b.Balance - a.Balance
        }

        const createLeaderboard = (users) => {
            const sortedUsers = users.sort(sortFunction);

            sortedUsers.forEach((x, i, arr) => arr[i] = `${i+1}. **${x.Username}:** \`${format.format(x.Balance)} sP\``);
            sortedUsers.length = Math.min(10, sortedUsers.length);
    
            const leaderContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(subCommand == "globális" ? "### Globális sasPont ranglista" : `### ${interaction.guild.name} sasPont ranglista`))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(sortedUsers.join("\n")));

            interaction.reply({ components: [leaderContainer], flags: MessageFlags.IsComponentsV2 });
        }

        if (subCommand === "adatok") {
            let saspontUser = saspontData.Users.find(x => x.UserID === user.id);
            if (!saspontUser) return interaction.reply({ content: "Ez a tag még nem szerzett sasPontokat!", flags: MessageFlags.Ephemeral });
            let saspontHistroy = saspontUser.History;

            let history = [];

            if (!saspontHistroy || saspontHistroy?.length === 0) history.push("- Nincs előzmény")
            else {
                history = saspontHistroy.map(x => `> \`${Math.sign(x.Value) === -1 ? "" : "+"}${format.format(x.Value)} sP\` (${x.Origin}) | ${x.Date}`).reverse();
                history.length = Math.min(5, saspontHistroy.length);
            }

            const sortedUsers = saspontData.Users.sort(sortFunction);
            const findUserIndex = sortedUsers.findIndex(x => x.UserID == saspontUser.UserID);

            const crashWinrate = saspontUser.Casino.Crash.Wins / (saspontUser.Casino.Crash.Wins + saspontUser.Casino.Crash.Losses) * 100 || 0;
            const coinflipWinrate = saspontUser.Casino.Coinflip.Wins / (saspontUser.Casino.Coinflip.Wins + saspontUser.Casino.Coinflip.Losses) * 100 || 0;
            const crashMaxMult = saspontUser.Casino.Crash.MaxMult || 0;
            const crashMaxWin = saspontUser.Casino.Crash.MaxWin || 0;
            const coinflipMaxWin = saspontUser.Casino.Coinflip.MaxWin || 0;

            const dataContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### sasPont adatok: \`${user.displayName}\``))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Egyenleg:** \`${format.format(saspontUser.Balance)} sP\`${saspontUser.OnLeaderboard ? `\n- **Globális helyezés:** \`${findUserIndex + 1}.\`\n` : "\n"}- **Kaszinó:**\n    - **Crash:**\n    - **Winrate**: \`${Math.trunc(crashWinrate)}%\`\n    - **Legnagyobb szorzó:** \`${crashMaxMult}x\`\n    - **Legnagyobb nyeremény:** \`${crashMaxWin} sP\`\n   - **Coinflip**:\n    - **Winrate**: \`${Math.trunc(coinflipWinrate)}%\`\n    - **Legnagyobb nyeremény:** \`${coinflipMaxWin} sP\`\n- **Korábbi sasPont-szerzések:**\n${history.join("\n")}`));

            if (interaction.user.id === saspontUser.UserID) {
                const optButton = new ButtonBuilder()
                .setStyle(saspontUser.OnLeaderboard ? ButtonStyle.Danger : ButtonStyle.Success)
                .setCustomId("1024")
                .setLabel(saspontUser.OnLeaderboard ? "Ne legyek rajta a globális ranglistán" : "Legyek rajta a globális ranglistán");

                const row = new ActionRowBuilder().addComponents(optButton);
                dataContainer.addActionRowComponents(row);
                const msg = await interaction.reply({ components: [dataContainer], flags: MessageFlags.IsComponentsV2 });

                const filter = (buttonInteraction) => {
                    if (buttonInteraction.user.id === interaction.user.id) return true;
                    else buttonInteraction.deferUpdate();
                }

                const collector = msg.createMessageComponentCollector({
                    filter,
                    time: 60000
                });

                collector.on("collect", async (ButtonInteraction) => {
                    saspontUser.OnLeaderboard = !saspontUser.OnLeaderboard;
                    await saspontData.save();

                    row.components[0]
                    .setStyle(saspontUser.OnLeaderboard ? ButtonStyle.Danger : ButtonStyle.Success)
                    .setLabel(saspontUser.OnLeaderboard ? "Ne legyek rajta a globális ranglistán" : "Legyek rajta a globális ranglistán");

                    await interaction.editReply({ components: [dataContainer], flags: MessageFlags.IsComponentsV2 });
                    await ButtonInteraction.deferUpdate();
                })

                collector.on("end", async () => {
                    row.components[0].setDisabled(true);

                    await interaction.editReply({ components: [dataContainer], flags: MessageFlags.IsComponentsV2 });
                });
            } else {
                interaction.reply({ components: [dataContainer], flags: MessageFlags.IsComponentsV2 });
            }
        }

        if (subCommandGroup === "ranglista") {
            const includedUsers = saspontData.Users.filter(x => x.OnLeaderboard);
            if (subCommand === "globális") {
                createLeaderboard(includedUsers);
            }
            
            if (subCommand === "szerver") {
                if (interaction.channel.type === 1) return interaction.reply({ content: "Ez az alparancs csak szervereken használható!", flags: MessageFlags.Ephemeral });

                const isMember = async (id) => await interaction.guild.members.fetch(id).then(() => true).catch(() => false);

                const membership = await Promise.all(saspontData.Users.map(user => isMember(user.UserID)));
                const users = saspontData.Users.filter((user, id) => membership[id]);
                
                createLeaderboard(users);
            }
        }

        if (subCommandGroup === "casino") {
            const bet = interaction.options.getNumber("tét");
            let saspontUser = saspontData.Users.find(x => x.UserID === interaction.user.id);

            if (bet > saspontUser.Balance) return interaction.reply({ content: "Nincs ennyi sasPontod!", flags: MessageFlags.Ephemeral });

            saspontUser.Balance -= bet;
            await saspontData.save();

            if (subCommand === "crash") {
                const buttonNext = new ButtonBuilder()
                .setStyle("Primary")
                .setCustomId("stay")
                .setLabel("Emelés (50%)");
        
                const buttonCashout = new ButtonBuilder()
                .setStyle("Success")
                .setCustomId("cashout")
                .setLabel(`Begyűjtés (${format.format(bet)} sP)`);

                const row = new ActionRowBuilder().addComponents(buttonCashout, buttonNext);

                const getCrashPoint = () => Math.random() < 0.5;

                let multiplier = 1.00;
                const getMultiplier = (round) => {
                    if (round <= 0) return 0;
                    if (round === 1) return 2;
                    if (round === 2) return 3;

                    let a = 2;
                    let b = 3;
                    for (let i = 3; i <= round; i++) {
                        const next = a + b;
                        a = b;
                        b = next;
                    }
                    
                    return b;
                }

                const crashContainer = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### sasPont Crash: \`1x\``))
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Tét:** \`${format.format(bet)} sP\``))
                .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
                .addActionRowComponents(row);

                const msg = await interaction.reply({ components: [crashContainer], flags: MessageFlags.IsComponentsV2 });
                
                const filter = (buttonInteraction) => {
                    if (buttonInteraction.user.id === interaction.user.id) return true;
                    else buttonInteraction.deferUpdate();
                }
        
                const collector = msg.createMessageComponentCollector({
                    filter,
                    idle: 120000
                });
        
                collector.on("collect", async (ButtonInteraction) => {
                    const id = ButtonInteraction.customId;

                    if (id === "cashout") {
                        saspontUser.Balance += Math.round(bet * multiplier);
                        saspontUser.Casino.Crash.Wins += 1;
                        saspontUser.History.push({
                            Value: Math.round(bet * multiplier) - bet,
                            Origin: "sP-Crash",
                            Guild: interaction.channel.type === 1 ? "DM" : interaction.guild.name,
                            Date: moment().tz("Europe/Budapest").format("YYYY-MM-DD HH:mm")
                        });

                        if (multiplier > saspontUser.Casino.Crash.MaxMult) saspontUser.Casino.Crash.MaxMult = multiplier;
                        if (Math.round(bet * multiplier) > saspontUser.Casino.Crash.MaxWin) saspontUser.Casino.Crash.MaxWin = Math.round(bet * multiplier);
        
                        await saspontData.save();

                        crashContainer
                        .spliceComponents(0, 1, new TextDisplayBuilder().setContent(`### sasPont Crash: \`${multiplier}x\``))
                        .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
                        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# +${format.format(Math.round(bet * multiplier))} (${format.format(Math.round(bet * multiplier - bet))}) sasPont`))
                        .setAccentColor(0x19cc10);

                        await interaction.editReply({ components: [crashContainer], flags: MessageFlags.IsComponentsV2 });
                        collector.stop();

                        return await ButtonInteraction.deferUpdate();
                    }

                    const crashPoint = getCrashPoint();
                    let old_multiplier = multiplier;
                    multiplier = getMultiplier(collector.total);

                    if (id === "stay") {
                        crashContainer.spliceComponents(0, 1, new TextDisplayBuilder().setContent(`### sasPont Crash: \`${multiplier}x\``));

                        if (!crashPoint) {
                            saspontUser.Casino.Crash.Losses += 1;
                            saspontUser.History.push({
                                Value: bet * (-1),
                                Origin: "sP-Crash",
                                Guild: interaction.channel.type === 1 ? "DM" : interaction.guild.name,
                                Date: moment().tz("Europe/Budapest").format("YYYY-MM-DD HH:mm")
                            });
            
                            await saspontData.save();

                            crashContainer
                            .spliceComponents(0, 1, new TextDisplayBuilder().setContent(`### sasPont Crash: \`${old_multiplier}x\``))
                            .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
                            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# -${format.format(bet)} sasPont`))
                            .setAccentColor(0xe2162e);

                            collector.stop();
                        } else {
                            buttonCashout.setLabel(`Begyűjtés (${format.format(Math.round(bet * multiplier))} sP)`);
                        }
                        await interaction.editReply({ components: [crashContainer], flags: MessageFlags.IsComponentsV2 });
                    }
        
                    await ButtonInteraction.deferUpdate();
                })
        
                collector.on("end", async () => {
                    row.components[0].setDisabled(true);
                    row.components[1].setDisabled(true);
        
                    await interaction.editReply({ components: [crashContainer], flags: MessageFlags.IsComponentsV2 });
                });
            }

            if (subCommand === "coinflip") {
                const side = interaction.options.getString("oldal");

                const sides = [
                    "Fej",
                    "Írás"
                ];

                const finalSide = Math.floor(Math.random() * sides.length);
        
                const coinflipContainer = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent("### sasPont Coinflip"))
                .addSeparatorComponents(new SeparatorBuilder())
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Tét:** \`${format.format(bet)} sP\`\n- **Választás:** \`${side.charAt(0).toUpperCase() + side.slice(1)}\`\n- **Eredmény:** \`${sides[finalSide]}\``))
                .addSeparatorComponents(new SeparatorBuilder().setDivider(false));

                if (sides[finalSide].toLowerCase() === side) {
                    coinflipContainer
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# +${format.format(bet * 2)} (${format.format(bet)}) sasPont`))
                    .setAccentColor(0x19cc10);

                    saspontUser.Balance += bet * 2;
                    saspontUser.Casino.Coinflip.Wins += 1;
                    saspontUser.History.push({
                        Value: bet,
                        Origin: "sP-Coinflip",
                        Guild: interaction.channel.type === 1 ? "DM" : interaction.guild.name,
                        Date: moment().tz("Europe/Budapest").format("YYYY-MM-DD HH:mm")
                    });

                    if (bet * 2 > saspontUser.Casino.Coinflip.MaxWin) saspontUser.Casino.Coinflip.MaxWin = bet * 2;
    
                    await saspontData.save();
                } else {
                    coinflipContainer
                    .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# -${format.format(bet)} sasPont`))
                    .setAccentColor(0xe2162e);

                    saspontUser.Casino.Coinflip.Losses += 1;
                    saspontUser.History.push({
                        Value: bet * -1,
                        Origin: "sP-Coinflip",
                        Guild: interaction.channel.type === 1 ? "DM" : interaction.guild.name,
                        Date: moment().tz("Europe/Budapest").format("YYYY-MM-DD HH:mm")
                    });
    
                    await saspontData.save();
                }

                interaction.reply({ components: [coinflipContainer], flags: MessageFlags.IsComponentsV2 });
            }
        }

        if (subCommand == "súgó") {
            const helpContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Hogyan működik?\n- Különböző sasBot-tal való interakciókért sasPontokat szerezhetsz és veszthetsz, amik gyűjtésével felkerülhetsz a ranglistákra:\n    - Minden sasBot parancs használatért +5 sP jár\n   - `Ötbetű`: minél kevesebb próbából kitalálod, annál több sP-t kapsz\n   - `Szóharc`: ha nyersz, a szavad pontszámának kétszeresének megfelelő sP-t kapsz\n### sasPont Kaszinó\n- `Coinflip`: találd el az érme oldalát és duplázd meg a tétedet, vagy vesztesz\n- `Crash`: a szorzó minden gombnyomásra 50% eséllyel növekedhet, de ugyanennyi eséllyel be is dőlhet. Gyűjtsd be a sasPontokat mielőtt ez megtörténik, vagy elveszíted a tétedet"));

            interaction.reply({ components: [helpContainer], flags: MessageFlags.IsComponentsV2 });
        }
    }
}