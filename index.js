require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  Events
} = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const proizvodi = [
  "Piletina",
  "Vuna",
  "Jaje",
  "Goveđe meso",
  "Kravlje mleko",
  "Seme konja",
  "Dlake grive",
  "Svinjska mast",
  "Svinjsko meso",
  "Kozje mleko",
  "Jareće meso"
];

function evidencijaButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("evidentiraj")
      .setLabel("EVIDENTIRAJ")
      .setStyle(ButtonStyle.Success)
  );
}

client.once(Events.ClientReady, async () => {
  console.log(`Bot online kao ${client.user.tag}`);

  const channel = await client.channels.fetch(process.env.CHANNEL_ID);

  await channel.send({
    content: "**Klikni gumb za evidentiranje pokupljenih proizvoda:**",
    components: [evidencijaButton()]
  });
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton() && interaction.customId === "evidentiraj") {
    const modal = new ModalBuilder()
      .setCustomId("forma_evidencija")
      .setTitle("Evidencija proizvoda");

    const proizvodiInput = new TextInputBuilder()
      .setCustomId("proizvodi")
      .setLabel("Količine proizvoda redom")
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder("18\n18\n12\n12\n12\n18\n6\n12\n12\n12\n12")
      .setRequired(true);

    const djubrivoInput = new TextInputBuilder()
      .setCustomId("djubrivo")
      .setLabel("Pokupljeno đubrivo")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("13")
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(proizvodiInput),
      new ActionRowBuilder().addComponents(djubrivoInput)
    );

    await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId === "forma_evidencija") {
    const proizvodiRaw = interaction.fields.getTextInputValue("proizvodi");
    const djubrivo = interaction.fields.getTextInputValue("djubrivo");

    const kolicine = proizvodiRaw
      .split("\n")
      .map(x => x.trim())
      .filter(Boolean);

    let tekst = "**Pokupljeni proizvodi:**\n";

    proizvodi.forEach((naziv, index) => {
      const kolicina = kolicine[index] || "0";
      tekst += `${kolicina} X ${naziv}\n`;
    });

    tekst += `\n**Pokupljeno đubrivo:** ${djubrivo}`;

    const embed = new EmbedBuilder()
      .setTitle("Nova evidencija")
      .setDescription(tekst)
      .setColor(0x00ff00)
      .setFooter({
        text: `Evidentirao: ${interaction.user.tag}`
      })
      .setTimestamp();

    await interaction.reply({
      content: "Evidencija je spremljena.",
      ephemeral: true
    });

    await interaction.channel.send({
      embeds: [embed],
      components: [evidencijaButton()]
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
