import { ApplicationCommandOptionType, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, SeparatorBuilder, ButtonBuilder, SectionBuilder } from "discord.js";
import { NekosiaAPI } from "nekosia.js";
import allNekosia from "../../../data/nekosia.json" with { type: "json" };

export default {
    name: "nekosia",
    description: "Képek a Nekosia API-ból",
    info: "Anime képek keresése kategória vagy címkék megadásával.\n`Néhány címke csak NSFW csatornában használható.`",
    options: [
        {
            name: "kép",
            description: "Kép keresése",
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    name: "kategória",
                    description: "Kategória megadása (üres: random)",
                    type: ApplicationCommandOptionType.String,
                    required: false
                },
                {
                    name: "címkék",
                    description: "Címkék megadása vesszővel elválasztva (pl. mad,nap) (üres: nincs)",
                    type: ApplicationCommandOptionType.String,
                    required: false
                }
            ]
        },
        {
            name: "súgó",
            description: "Segítség a kategóriákhoz és címkékhez",
            type: ApplicationCommandOptionType.Subcommand
        }
    ],
    run: async (client, interaction) => {

        const subCommand = interaction.options.getSubcommand();

        const helpContainer = new ContainerBuilder()
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### Nekosia súgó`))
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`- **Kategóriák:**\n\`\`\`${allNekosia.join(", ")}\`\`\`\n- **[Címkék](https://api.nekosia.cat/api/v1/tags)**`))
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# Képet kategória vagy címkék alapján lehet keresni, ha mindkettő meg van adva, akkor címkék szerint lesz keresve.`));

        if (subCommand === "súgó") {
            return interaction.reply({ components: [helpContainer], flags: MessageFlags.IsComponentsV2 });
        }

        if (subCommand === "kép") {
            let category = interaction.options.getString("kategória");
            const tags = interaction.options.getString("címkék") || "";
            let fetchedNekosiaJson, headerString;

            if (!category && !tags) {
                fetchedNekosiaJson = await NekosiaAPI.fetchCategoryImages("random");
            } else if (tags) {
                fetchedNekosiaJson = await NekosiaAPI.fetchImages({ count: 1, tags: tags.split(",")});
                headerString = `Címkék: \`${tags}\``;
            } else {
                fetchedNekosiaJson = await NekosiaAPI.fetchCategoryImages(category);
                headerString = `Kategória: \`${category}\``;
            }

            if ((category && category !== "nothing") && !allNekosia.includes(category.toLowerCase())) {
                return interaction.reply({ components: [helpContainer], flags: MessageFlags.IsComponentsV2 });
            }

            if (fetchedNekosiaJson.status === 403) {
                if (!interaction.channel.nsfw) return interaction.reply({ content: "Ez a kategória csak NSFW csatornákban érhető el!", flags: MessageFlags.Ephemeral });
            }

            if (!fetchedNekosiaJson.success) {
                return interaction.reply({ content: "Egy kép sem található!", flags: MessageFlags.Ephemeral });
            }

            const nekosiaGalleryComponent = new MediaGalleryBuilder()
            .addItems([
                {
                    media: {
                        url: fetchedNekosiaJson.image.original.url
                    }
                }
            ]);

            const linkButton = new ButtonBuilder()
            .setStyle("Link")
            .setURL(fetchedNekosiaJson.source.url)
            .setLabel("Megnyitás");

            const headerSection = new SectionBuilder()
            .addTextDisplayComponents(new TextDisplayBuilder().setContent("### Nekosia"))
            .setButtonAccessory(linkButton);

            if (headerString) headerSection.addTextDisplayComponents(new TextDisplayBuilder().setContent(headerString));

            const nekosiaContainer = new ContainerBuilder()
            .setAccentColor(parseInt(fetchedNekosiaJson.colors.main.slice(1), 16))
            .addSectionComponents(headerSection)
            .addSeparatorComponents(new SeparatorBuilder())
            .addMediaGalleryComponents(nekosiaGalleryComponent);
            
            if (fetchedNekosiaJson.attribution.artist.username !== null) {
                nekosiaContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`- [${fetchedNekosiaJson.attribution.artist.username}](${fetchedNekosiaJson.attribution.artist.profile})`));
            }

            interaction.reply({ components: [nekosiaContainer], flags: MessageFlags.IsComponentsV2 });
        }
    }
}