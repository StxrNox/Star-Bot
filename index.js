const { Client, GatewayIntentBits, REST, Routes, PermissionsBitField } = require('discord.js');
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent, 
        GatewayIntentBits.GuildMembers
    ] 
});

const token = 'Ur-token-here'; 
const clientId = 'ur bot id here';

const warns = new Map();

const commands = [
    {
        name: 'warn',
        description: 'Warnea a un usuario',
        options: [
            {
                type: 6, 
                name: 'usuario',
                description: 'Usuario a warnear',
                required: true
            }
        ]
    },
    {
        name: 'removewarn',
        description: 'Quita un warn a un usuario',
        options: [
            {
                type: 6,
                name: 'usuario',
                description: 'Usuario al que se le quitará un warn',
                required: true
            }
        ]
    },
    {
        name: 'mute',
        description: 'Mutea a un usuario',
        options: [
            {
                type: 6,
                name: 'usuario',
                description: 'Usuario a mutear',
                required: true
            }
        ]
    },
    {
        name: 'ban',
        description: 'Banea a un usuario',
        options: [
            {
                type: 6,
                name: 'usuario',
                description: 'Usuario a banear',
                required: true
            }
        ]
    },
    {
        name: 'ping',
        description: 'Responde con la latencia del bot'
    }
];

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
    try {
        console.log('Iniciando la actualización de comandos de barra...');
        await rest.put(Routes.applicationCommands(clientId), {
            body: commands,
        });
        console.log('Comandos de barra registrados globalmente.');
    } catch (error) {
        console.error('Error al registrar comandos:', error);
    }
})();

client.on('ready', () => {
    console.log(`Bot conectado como ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    const member = interaction.member;
    if (!member || !(member.permissions instanceof PermissionsBitField) || !member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        return interaction.reply('No tienes permiso para usar este comando.');
    }    

    const target = options.getMember('usuario');

    if (commandName === 'warn') {
        if (!target) return interaction.reply('Debes mencionar a un usuario para warnear.');
        const userWarns = warns.get(target.id) || 0;
        warns.set(target.id, userWarns + 1);

        await interaction.reply(`${target.user.tag} ha sido warneado. Advertencias: ${warns.get(target.id)}`);

        if (warns.get(target.id) === 3) {
            await target.ban();
            await interaction.reply(`${target.user.tag} ha sido baneado por alcanzar 3 advertencias.`);
            warns.delete(target.id);
        }
    } else if (commandName === 'removewarn') {
        if (!target) return interaction.reply('Debes mencionar a un usuario para quitarle un warn.');
        const userWarns = warns.get(target.id) || 0;

        if (userWarns > 0) {
            warns.set(target.id, userWarns - 1);
            await interaction.reply(`Se ha removido un warn de ${target.user.tag}. Advertencias restantes: ${warns.get(target.id)}`);
        } else {
            await interaction.reply(`${target.user.tag} no tiene warns.`);
        }
    } else if (commandName === 'mute') {
        if (!target) return interaction.reply('Debes mencionar a un usuario para mutear.');
        const muteRole = interaction.guild.roles.cache.find(role => role.name === 'Muted');
        if (!muteRole) return interaction.reply('No se encontró un rol "Muted".');

        await target.roles.add(muteRole);
        await interaction.reply(`${target.user.tag} ha sido muteado.`);
    } else if (commandName === 'ban') {
        if (!target) return interaction.reply('Debes mencionar a un usuario para banear.');
        await target.ban();
        await interaction.reply(`${target.user.tag} ha sido baneado.`);
    } else if (commandName === 'ping') {
        const latency = Date.now() - interaction.createdTimestamp;
        await interaction.reply(`Pong! Latencia del bot: ${latency}ms`);
    }
});

client.login(token);