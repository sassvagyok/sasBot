import { ApplicationCommandOptionType, PermissionFlagsBits, MessageFlags } from "discord.js";
import djRoleSchema from "../../../models/djroleModel.js";

export default {
    name: "djrole",
    description: "DJ rang kezelése",
    info: "DJ rang beállítása, kikapcsolása vagy beállított megnézése, amivel kezelhető a zenelejátszás.\n`Szükséges jogosultság: Adminisztrátor`",
    dm_permission: false,
    permission: PermissionFlagsBits.Administrator,
    options: [
        {
            name: "beállítás",
            description: "DJ rang beállítása",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "rang",
                    description: "Új DJ rang, amivel a zenelejátszás kezelhető lesz (kivétel: Lyrics, Most, Queue)",
                    type: ApplicationCommandOptionType.Role,
                    required: true
                }
            ]
        },
        {
            name: "kikapcsolás",
            description: "DJ rang követelményének kikapcsolása",
            type: ApplicationCommandOptionType.Subcommand
        },
        {
            name: "beállított",
            description: "Beállított DJ rang megjelenítése",
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async (client, interaction) => {

        const djRoleData = await djRoleSchema.findOne({ Guild: interaction.guild.id });
        const subCommand = interaction.options.getSubcommand();
        const djRole = interaction.options.getRole("rang");

        if (subCommand === "beállított") {
            if (djRoleData) {
                const currentDjRole = interaction.guild.roles.cache.get(djRoleData.Role);

                interaction.reply({ content: `Beállított DJ rang: ${currentDjRole}` });
            } else interaction.reply({ content: "Nincs DJ rang beállítva!", flags: MessageFlags.Ephemeral });
        }

        if (subCommand === "beállítás") {
            if (djRoleData) await djRoleSchema.findOneAndUpdate({ Guild: interaction.guild.id}, { Role: djRole.id });
            else {
                const newData = new djRoleSchema({
                    Guild: interaction.guild.id,
                    Role: djRole.id
                });
                await newData.save();
            }

            interaction.reply({ content: `${djRole} beállítva DJ rangként` });
        }

        if (subCommand === "kikapcsolás") {
            if (djRoleData) {
                await djRoleSchema.findOneAndDelete({ Guild: interaction.guild.id });

                interaction.reply({ content: "DJ rang követelmény kikapcsolva", flags: MessageFlags.Ephemeral });
            } else {
                interaction.reply({ content: "Nincs DJ rang beállítva!" });
            }
        }
    }
}