import { PermissionFlagsBits, ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder } from "discord.js";
import userModerationSchema from "../../../models/userModerationModel.js";
import serverModerationSchema from "../../../models/serverModerationModel.js";

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
        const numberOfModeration = interaction.options.getNumber("száma");
        const target = interaction.options.getUser("tag");

        let userModerationData;

        if (subCommand === "sorszám") {
            const serverModerationData = await serverModerationSchema.findOne({ Guild: interaction.guild.id });
            if (!serverModerationData) return interaction.reply({ content: "Egy moderáció sem található!", flags: MessageFlags.Ephemeral });

            const count = serverModerationData.Count
            if (count < 1) return interaction.reply({ content: "Még nem történt egy moderáció sem a szerveren!", flags: MessageFlags.Ephemeral });

            userModerationData = await userModerationSchema.find({ Guild: interaction.guild.id });
            if (!userModerationData) return interaction.reply({ content: "Egy moderáció sem található!", flags: MessageFlags.Ephemeral });
            
            const mapLogs = (type) => userModerationData.map(w => w[type]).flat().filter(n => n.Number === numberOfModeration);
            const types = ["Bans", "Kicks", "Timeouts", "Warns"]
    
            let finalLog;
            for (let i = 0; i < 4; i++) {
                if (mapLogs(types[i]).length !== 0) {
                    finalLog = mapLogs(types[i]);
                    break;
                }
            }
    
            if (!finalLog) return interaction.reply({ content: `#${numberOfModeration} számú moderáció nem található! Összes moderáció a szerveren: ${count}`, flags: MessageFlags.Ephemeral });
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
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### \`#${numberOfModeration}\` - ${names[finalLog.Type]}`))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Tag:** \`${targetUser.username}\` (${finalLog.Target})${finalLog.Length ? `\n- **Időtartam:** \`${finalLog.Length}\`` : ""}${finalLog.Reason ? `\n- **Indok:** \`${finalLog.Reason}\`` : ""}`))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${modAuthor.username} ● \`${finalLog.Date}\``));
    
            interaction.reply({ components: [moderationsContainer], flags: MessageFlags.IsComponentsV2, allowedMentions: {} });
        }

        if (subCommand === "tag") {
            let memberTarget = interaction.guild.members.cache.get(target.id) || await interaction.guild.members.fetch(target.id).catch(err => {});
            userModerationData = await userModerationSchema.findOne({ Guild: interaction.guild.id, User: target.id });

            if (!userModerationData) return interaction.reply({ content: "A megadott tagnak nincs moderációs előzménye!" });

            let bans = [];
            let kicks = [];
            let timeouts = [];
            let warns = [];

            for (let i = 0; i < userModerationData.Bans.length; i++) bans.push("#" + userModerationData.Bans[i].Number);
            for (let i = 0; i < userModerationData.Kicks.length; i++) kicks.push("#" + userModerationData.Kicks[i].Number);
            for (let i = 0; i < userModerationData.Timeouts.length; i++) timeouts.push("#" + userModerationData.Timeouts[i].Number);
            for (let i = 0; i < userModerationData.Warns.length; i++) warns.push("#" + userModerationData.Warns[i].Number);

            let sumOfModerations = bans.length + kicks.length + timeouts.length + warns.length;

            bans = userModerationData.Bans.length === 0 ? " " : bans.join(", ").toString();
            kicks = userModerationData.Kicks.length === 0 ? " " : kicks.join(", ").toString();
            timeouts = userModerationData.Timeouts.length === 0 ? " " : timeouts.join(", ").toString();
            warns = userModerationData.Warns.length === 0 ? " " : warns.join(", ").toString();

            const moderationsContainer = new ContainerBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Moderációk (${sumOfModerations}): \`${memberTarget.user.username}\``))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Kitiltások -** \`${userModerationData.Bans.length}\`\n- ${bans.length > 995 ? bans.substring(0, 994) + "..." : bans}`))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Kirúgások -** \`${userModerationData.Kicks.length}\`\n- ${kicks.length > 995 ? kicks.substring(0, 994) + "..." : kicks}`))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Felfüggesztések -** \`${userModerationData.Timeouts.length}\`\n- ${timeouts.length > 995 ? timeouts.substring(0, 994) + "..." : timeouts}`))
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Figyelmeztetések -** \`${userModerationData.Warns.length}\`\n- ${warns.length > 995 ? warns.substring(0, 994) + "..." : warns}`))

            interaction.reply({ components: [moderationsContainer], flags: MessageFlags.IsComponentsV2 });
        }
    }
}