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

        const subCommand = interaction.options.getSubcommand();
        const rang = interaction.options.getRole("rang");

        const djRoleData = await djRoleSchema.findOne({ Guild: interaction.guild.id });

        if (subCommand === "beállított") {
            if (djRoleData) {
                const setRang = interaction.guild.roles.cache.get(djRoleData.Role);

                interaction.reply({ content: `Beállított DJ rang: ${setRang}` });
            } else interaction.reply({ content: "Nincs DJ rang beállítva!", flags: MessageFlags.Ephemeral });
        }

        if (subCommand === "beállítás") {
            if (djRoleData) await djRoleSchema.findOneAndUpdate({ Guild: interaction.guild.id}, { Role: rang.id });
            else {
                const newData = new djRoleSchema({
                    Guild: interaction.guild.id,
                    Role: rang.id
                });
                await newData.save();
            }

            interaction.reply({ content: `${rang} beállítva DJ rangként` });
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