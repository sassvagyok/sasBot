import { ApplicationCommandOptionType, PermissionFlagsBits, MessageFlags, ContainerBuilder, TextDisplayBuilder } from "discord.js";
import autoRoleSchema from "../../../models/autoroleModel.js";

export default {
    name: "autoroles",
    description: "Automatikus rangok kezelése",
    info: "Rangok kezelése, amiket az újonnan csatlakozott tagok automatikusan megkapnak.\n`Szükséges jogosultság: Adminisztrátor`",
    dm_permission: false,
    permission: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "hozzáadás",
            description: "Rang hozzáadása az automatikusan adott rangokhoz",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "rang",
                    description: "Rang, amit hozzáadsz az automatikus rangokhoz",
                    type: ApplicationCommandOptionType.Role,
                    required: true
                }
            ]
        },
        {
            name: "eltávolítás",
            description: "Rang eltávolítása az automatikusan adott rangok közül",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "rang",
                    description: "Rang, amit eltávolítasz az automatikus rangok közül",
                    type: ApplicationCommandOptionType.Role,
                    required: true
                }
            ]
        },
        {
            name: "kikapcsolás",
            description: "Automatikus rangadás kikapcsolása és hozzáadott rangok listájának törlése",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "hozzáadott",
            description: "Hozzáadott automatikus rangok megjelenítése",
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async (client, interaction) => {

        const autoRoleData = await autoRoleSchema.findOne({ Guild: interaction.guild.id });
        const subCommand = interaction.options.getSubcommand();
        const autoRole = interaction.options.getRole("rang");
        const autoRoleName = autoRole?.name;
        const autoRoleId = autoRole?.id;

        if (subCommand === "hozzáadás") {
            if (autoRoleData) {
                if (autoRoleData.Roles.includes(autoRoleId)) {
                    return interaction.reply({ content: `\`${autoRoleName}\` már hozzá van adva az automatikus rangokhoz!`, flags: MessageFlags.Ephemeral });
                } else {
                    autoRoleData.Roles.push(autoRoleId);
                    await autoRoleData.save();

                    interaction.reply({ content: `\`${autoRoleName}\` hozzáadva az automatikus rangokhoz` });
                }
            } else {
                const newData = new autoRoleSchema({
                    Guild: interaction.guild.id,
                    Roles: [autoRoleId]
                });
                await newData.save();

                interaction.reply({ content: `\`${autoRoleName}\` hozzáadva az automatikus rangokhoz` });
            }
        }

        if (subCommand === "eltávolítás") {
            if (autoRoleData) {
                if (autoRoleData.Roles.includes(autoRoleId)) {
                    const index = autoRoleData.Roles.indexOf(autoRoleId);

                    if (index > -1) {
                        autoRoleData.Roles.splice(index, 1);
                        await autoRoleData.save();

                        interaction.reply({ content: `\`${autoRoleName}\` eltávolítva az automatikus rangokból` });

                        if (autoRoleData.Roles.length === 0) await autoRoleSchema.deleteOne({ Guild: interaction.guild.id });
                    }
                } else {
                    interaction.reply({ content: `\`${autoRoleName}\` nincs hozzáadva az automatikus rangokhoz!`, flags: MessageFlags.Ephemeral });
                }
            } else {
                interaction.reply({ content: `\`${autoRoleName}\` nincs hozzáadva az automatikus rangokhoz!`, flags: MessageFlags.Ephemeral });
            }
        }

        if (subCommand === "kikapcsolás") {
            if (autoRoleData) {
                await autoRoleSchema.findOneAndDelete({ Guild: interaction.guild.id });

                interaction.reply({ content: "Automatikus rangadás kikapcsolva (összes hozzáadott rang eltávolítva)!" });
            } else interaction.reply({ content: "Nincs egy automatikus rang sem hozzáadva!", flags: MessageFlags.Ephemeral });
        }

        if (subCommand === "hozzáadott") {
            if (autoRoleData) {
                let roles = [];

                for (let i = 0; i < autoRoleData.Roles.length; i++) {
                    const role = interaction.guild.roles.cache.find(role => role.id == autoRoleData.Roles[i]);

                    roles.push("<@&" + role + ">");
                }

                let formattedRoles = "";

                if (roles.length > 0) {
                    for (let i = 0; i < roles.length; i++) {
                        if (formattedRoles.length + roles[i].length > 1000) {
                            if (formattedRoles.length < 996) formattedRoles += " ...";
                            break;
                        } else formattedRoles += roles[i];

                        if (i < roles.length - 1) {
                            formattedRoles += " ";
                        }
                    }
                } else formattedRoles = "Nincs egy automatikus rang sem hozzáadva!";

                const autorolesContainer = new ContainerBuilder()
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Automatikus rangok (${roles.length}):`))
                .addTextDisplayComponents(new TextDisplayBuilder().setContent(formattedRoles));

                interaction.reply({ components: [autorolesContainer], flags: MessageFlags.IsComponentsV2, allowedMentions: {} });
            } else interaction.reply({ content: "Nincs egy automatikus rang sem hozzáadva!", flags: MessageFlags.Ephemeral });
        }
    }
}