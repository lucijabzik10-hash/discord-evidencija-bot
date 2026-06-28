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

const sessions = new Map();

const proizvodi = [
  "Piletina",
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

function nastaviButton(korak) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`nastavi_${korak}`)
      .setLabel(`NASTAVI ${korak}/3`)
      .setStyle(ButtonStyle.Primary)
  );
}

function napraviModal(korak) {
  const modal = new ModalBuilder()
    .setCustomId(`forma_${korak}`)
    .setTitle(`Evidencija ${korak}/3`);

  let lista = [];

  if (korak === 1) {
    lista = proizvodi.slice(0, 5);
  }

  if (korak === 2) {
    lista = proizvodi.slice(5, 10);
  }

  if (korak === 3) {
    lista = ["Pokupljeno đubrivo"];
  }

  lista.forEach((naziv, index) => {
    const input = new TextInputBuilder()
      .setCustomId(`polje_${index}`)
      .setLabel(naziv)
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("Upiši količinu")
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(input)
    );
  });

  return modal;
}

client.once(Events.ClientReady, async () => {
  console.log(`Bot online kao ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(process.env.CHANNEL_ID);

    await channel.send({
      content: "**Klikni gumb za evidentiranje pokupljenih proizvoda:**",
      components: [evidencijaButton()]
    });
  } catch (error) {
    console.error("Greška kod slanja početne poruke:", error.message);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isButton() && interaction.customId === "evidentiraj") {
    sessions.set(interaction.user.id, {});
    await interaction.showModal(napraviModal(1));
  }

  if (interaction.isButton() && interaction.customId === "nastavi_2") {
    await interaction.showModal(napraviModal(2));
  }

  if (interaction.isButton() && interaction.customId === "nastavi_3") {
    await interaction.showModal(napraviModal(3));
  }

  if (interaction.isModalSubmit() && interaction.customId === "forma_1") {
    const data = sessions.get(interaction.user.id) || {};

    proizvodi.slice(0, 5).forEach((naziv, index) => {
      data[naziv] = interaction.fields.getTextInputValue(`polje_${index}`);
    });

    sessions.set(interaction.user.id, data);

    await interaction.reply({
      content: "Prvi dio spremljen. Klikni nastavak.",
      components: [nastaviButton(2)],
      ephemeral: true
    });
  }

  if (interaction.isModalSubmit() && interaction.customId === "forma_2") {
    const data = sessions.get(interaction.user.id) || {};

    proizvodi.slice(5, 10).forEach((naziv, index) => {
      data[naziv] = interaction.fields.getTextInputValue(`polje_${index}`);
    });

    sessions.set(interaction.user.id, data);

    await interaction.reply({
      content: "Drugi dio spremljen. Klikni nastavak.",
      components: [nastaviButton(3)],
      ephemeral: true
    });
  }

  if (interaction.isModalSubmit() && interaction.customId === "forma_3") {
    const data = sessions.get(interaction.user.id) || {};

    data["Pokupljeno đubrivo"] = interaction.fields.getTextInputValue("polje_0");

    let tekst = "**Pokupljeni proizvodi:**\n";

    proizvodi.forEach(naziv => {
      tekst += `${data[naziv] || "0"} X ${naziv}\n`;
    });

    tekst += `\n**Pokupljeno đubrivo:** ${data["Pokupljeno đubrivo"] || "0"}`;

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

    sessions.delete(interaction.user.id);
  }
});

client.login(process.env.DISCORD_TOKEN);
