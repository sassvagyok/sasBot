import { PermissionFlagsBits, ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import moderationSchema from "../../../models/moderationlogModel.js";

export default {
    name: "moderations",
    description: "Múltbéli moderációk megtekintése",
    info: "Múltbéli moderációk keresése sorszám alapján, vagy adott tag moderációinak sorszámának megjelenítése.\n`Szükséges jogosultság: Tagok felfüggesztése`",
    dm_permission: false,
    permission: PermissionFlagsBits.ModerateMembers,
    options: [
        {
            name: "sorszám",
            description: "Múltbéli moderációk keresése sorszám alapján",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "száma",
                    description: "Moderáció sorszáma",
                    type: ApplicationCommandOptionType.Number,
                    required: true,
                    minValue: 1
                }
            ]
        },
        {
            name: "tag",
            description: "Megadott tag moderációinak sorszámái",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "tag",
                    description: "Tag, akinek a moderációinak sorszámai jelenjenek meg",
                    type: ApplicationCommandOptionType.User,
                    required: true
                }
            ]
        }
    ],
    run: async (client, interaction) => {

        const subCommand = interaction.options.getSubcommand()
        const num = interaction.options.getNumber("száma");
        const target = interaction.options.getUser("tag");

        let moderationData;

        if (subCommand === "sorszám") {
            moderationData = await moderationSchema.find({ Guild: interaction.guild.id });

            if (!moderationData) return interaction.reply({ content: "Egy moderáció sem található!", flags: MessageFlags.Ephemeral });

            const max = moderationData.map(x => x.Count);
            count = Math.max(...max);

            if(count < 1) return interaction.reply({ content: "Még nem történt egy moderáció sem a szerveren!", flags: MessageFlags.Ephemeral });
            
            const mapLogs = (type) => moderationData.map(w => w[type]).flat().filter(n => n.Number === parseInt(num));
            const types = ["Bans", "Kicks", "Timeouts", "Warns"]
    
            let finalLog;
            for (let i = 0; i < 4; i++) {
                if (mapLogs(types[i]).length !== 0) {
                    finalLog = mapLogs(types[i]);
                    break;
                }
            }
    
            if (!finalLog) return interaction.reply({ content: `#${num} számú moderáció nem található! Összes moderáció a szerveren: ${count}`, flags: MessageFlags.Ephemeral });
            finalLog = finalLog[0];

            const colors = {
                Ban: 0xe2162e,
                Kick: 0xff6600,
                Timeout: 0xff9d02,
                Warn: 0xffd200
            }
    
            const names = {
                Ban: "Kitiltás",
                Kick: "Kirúgás",
                Timeout: "Felfüggesztés",
                Warn: "Figyelmeztetés"
            }
    
            let targetUser = await client.users.fetch(finalLog.Target.replace(/\D/g,""));
            let modAuthor = await client.users.fetch(finalLog.Author.replace(/\D/g,""));

            const moderationsContainer = new ContainerBuilder()
            .setAccentColor(colors[finalLog.Type])
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### \`#${num}\` - ${names[finalLog.Type]}`))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Tag:** \`${targetUser.username}\` (${finalLog.Target})${finalLog.Length ? `\n- **Időtartam:** \`${finalLog.Length}\`` : ""}${finalLog.Reason ? `\n- **Indok:** \`${finalLog.Reason}\`` : ""}`))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${modAuthor.username} ● \`${finalLog.Date}\``));
    
            interaction.reply({ components: [moderationsContainer], flags: MessageFlags.IsComponentsV2, allowedMentions: {} });
        }

        if (subCommand === "tag") {
            let memberTarget = interaction.guild.members.cache.get(target.id) || await interaction.guild.members.fetch(target.id).catch(err => {});
            moderationData = await moderationSchema.findOne({ Guild: interaction.guild.id, User: target.id });

            if (!moderationData) return interaction.reply({ content: "A megadott tag nem található!" });

            let bans = [];
            let kicks = [];
            let timeouts = [];
            let warns = [];

            for (let i = 0; i < moderationData.Bans.length; i++) bans.push("#" + moderationData.Bans[i].Number);
            for (let i = 0; i < moderationData.Kicks.length; i++) kicks.push("#" + moderationData.Kicks[i].Number);
            for (let i = 0; i < moderationData.Timeouts.length; i++) timeouts.push("#" + moderationData.Timeouts[i].Number);
            for (let i = 0; i < moderationData.Warns.length; i++) warns.push("#" + moderationData.Warns[i].Number);

            let sumOfModerations = bans.length + kicks.length + timeouts.length + warns.length;

            bans = moderationData.Bans.length === 0 ? " " : bans.join(", ").toString();
            kicks = moderationData.Kicks.length === 0 ? " " : kicks.join(", ").toString();
            timeouts = moderationData.Timeouts.length === 0 ? " " : timeouts.join(", ").toString();
            warns = moderationData.Warns.length === 0 ? " " : warns.join(", ").toString();

            const moderationsContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Moderációk (${sumOfModerations}): \`${memberTarget.user.username}\``))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Kitiltások -** \`${moderationData.Bans.length}\`\n- ${bans.length > 995 ? bans.substring(0, 994) + "..." : bans}`))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Kirúgások -** \`${moderationData.Kicks.length}\`\n- ${kicks.length > 995 ? kicks.substring(0, 994) + "..." : kicks}`))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Felfüggesztések -** \`${moderationData.Timeouts.length}\`\n- ${timeouts.length > 995 ? timeouts.substring(0, 994) + "..." : timeouts}`))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Figyelmeztetések -** \`${moderationData.Warns.length}\`\n- ${warns.length > 995 ? warns.substring(0, 994) + "..." : warns}`))

            interaction.reply({ components: [moderationsContainer], flags: MessageFlags.IsComponentsV2 });
        }
    }
}