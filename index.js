const inquirer = require('inquirer');
const axios = require('axios').default;
const fs = require('node:fs');
const path = require('path');

let channelId, token, interval

async function init() {
    const configPath = path.join(__dirname, 'config.json')
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath));
        channelId = config.channelId;
        token = config.token;
    } else {
        const questions = [
            {
                type: 'input',
                name: 'channelId',
                message: "Discord channel ID: ",
                validate: (value) => {
                    if (!value || isNaN(parseInt(value)) || parseInt(value) > 9223372036854775807) return 'Channel ID is not valid!';
                    else return true
                }
            },
            {
                type: 'password',
                name: 'token',
                message: "Your Discord TOKEN: ",
                validate: (value) => {
                    if (!value) return 'Token is required!'
                    else return true
                }
            },
            {
                type: 'confirm',
                name: 'config',
                message: "Would you like to create a config file to store your credentials?",
            },
        ];

        const answers = await inquirer.prompt(questions);

        channelId = answers.channelId;
        token = answers.token

        if (answers.config) {
            fs.writeFileSync(configPath, JSON.stringify({
                channelId: answers.channelId.toString(),
                token: answers.token
            }, null, 2))
        }
    }

    axios.get(`https://discord.com/api/v10/channels/${channelId}`, { headers: { Authorization: token } })
        .then(() => {
            console.log('Starting program')
            sendTyping();
            console.log('You are typing...')
            console.log('==================================')
            interval = setInterval(sendTyping, 8000);
        }).catch(err => {
            console.log('(DISCORD API ERROR) ' + err.response?.data?.message || err.message)
            console.log('Please check if your Discord Token and Channel ID are valid.');
            console.log('==================================')
            console.log('**Program Aborted**');
            process.stdin.resume();
            return pressToContinue();
        })
}

init();

function sendTyping() {
    axios.post(`https://discord.com/api/v9/channels/${channelId}/typing`, {}, { headers: { Authorization: token } })
        .catch(err => {
            console.log('(DISCORD API ERROR) ' + err.response?.data?.message || err.message);
            clearInterval(interval);
            console.log('Please check if your Discord Token and Channel ID are valid.');
            console.log('==================================')
            console.log('**Program Aborted**');
            return pressToContinue();
        });
}

function pressToContinue() {
    console.log('Press any key to continue...');
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', () => {
        process.stdin.removeAllListeners('data')
        console.clear();
        init();
    });
}