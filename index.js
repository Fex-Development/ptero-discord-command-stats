const { Client, Intents } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const axios = require('axios');
const config = require('./config.json');

const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const rest = new REST({ version: '9' }).setToken(`${config.token}`);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand() || interaction.commandName !== 'node') return;

    const mention = interaction.options.getMentionable('node');
    if (!mention) {
        await interaction.reply('Please mention a node.');
        return;
    }
    const nodeName = mention.name;

    try {
        const response = await axios.get(`${config.url}api/application/nodes/${nodeName}/utilization`, {
            headers: {
                'Authorization': `Bearer ${config.api}`,
                'Content-Type': 'application/json',
                'Accept': 'Application/vnd.pterodactyl.v1+json',
            },
        });

        const data = response.data;

        const embed = {
            title: `Node ${nodeName} Stats`,
            description: `CPU: ${data.cpu.toFixed(2)}%\nRAM: ${data.memory.current}/${data.memory.limit} MB (${((data.memory.current / data.memory.limit) * 100).toFixed(2)}%)\nDisk: ${data.disk.current}/${data.disk.limit} MB (${((data.disk.current / data.disk.limit) * 100).toFixed(2)}%)`,
            color: 0x00ff00,
        };

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        console.error(error);
        await interaction.reply('An error occurred while fetching node stats.');
    }
});

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(`${config.appid}`, `${config.gid}`),
            { body: [
                {
                    name: 'node',
                    description: 'Get stats for a Pterodactyl node.',
                    options: [
                        {
                            name: 'node',
                            description: 'The Pterodactyl node to get stats for.',
                            type: 'MENTIONABLE',
                            required: true,
                        },
                    ],
                },
            ]},
        );

        console.log('Successfully registered slash commands.');
    } catch (error) {
        console.error(error);
    }

    await client.login(`${config.token}`);
})();
