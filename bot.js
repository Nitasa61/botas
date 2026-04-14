const { Client, LocalAuth } = require('whatsapp-web.js');
const fs = require('fs');

// Load data
const numbers = fs.readFileSync('no.txt', 'utf-8')
    .split('\n')
    .map(n => n.trim())
    .filter(n => n.length > 5);

const messages = fs.readFileSync('kata.txt', 'utf-8')
    .split('\n')
    .map(m => m.trim())
    .filter(m => m.length > 0);

// Helper
function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

// Delay random 40–90 detik
function randomDelay() {
    return Math.floor(Math.random() * (90000 - 40000 + 1)) + 40000;
}

// Delay typing (simulate manusia)
function typingDelay(text) {
    return text.length * 100; // 100ms per karakter
}

// Client
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './session'
    }),
    puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    }
});

// QR → langsung jadi link
client.on('qr', (qr) => {
    console.log('\n🔗 Scan QR di link ini:\n');
    console.log(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${qr}\n`);
});

// Ready
client.on('ready', async () => {
    console.log('✅ Bot siap (PRO MODE)\n');

    while (true) {
        for (let number of numbers) {

            let cleanNumber = number.replace(/\D/g, '');
            let chatId = cleanNumber + "@c.us";
            let message = getRandom(messages);

            try {
                const isRegistered = await client.isRegisteredUser(chatId);

                if (!isRegistered) {
                    console.log(`❌ Tidak terdaftar: ${cleanNumber}`);
                    continue;
                }

                console.log(`📤 Kirim ke ${cleanNumber}`);

                const chat = await client.getChatById(chatId);

                // typing simulation
                await chat.sendStateTyping();
                await new Promise(res => setTimeout(res, typingDelay(message)));

                await client.sendMessage(chatId, message);

                console.log("✅ Terkirim\n");

            } catch (err) {
                console.log(`❌ Gagal ${cleanNumber}: ${err}\n`);
            }

            let delay = randomDelay();
            console.log(`⏳ Delay ${Math.floor(delay / 1000)} detik\n`);
            await new Promise(res => setTimeout(res, delay));
        }

        console.log("🔁 Ulang loop\n");
    }
});

// Auto reconnect
client.on('disconnected', (reason) => {
    console.log('⚠️ Disconnect:', reason);
    client.initialize();
});

client.initialize();
