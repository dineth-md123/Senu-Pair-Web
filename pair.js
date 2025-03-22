const express = require('express');
const fs = require('fs');
const pino = require("pino");
const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    makeCacheableSignalKeyStore,
    Browsers,
    jidNormalizedUser
} = require("@whiskeysockets/baileys");
const { upload } = require('./mega');

const router = express.Router();

// Helper: Generate unique IDs using a timestamp
function generateTimestamp() {
    return Date.now();
}

// Helper: Remove a folder and its contents
function removeFolder(folderPath) {
    if (!fs.existsSync(folderPath)) return false;
    fs.rmSync(folderPath, { recursive: true, force: true });
    console.log(`Removed folder: ${folderPath}`);
}

async function uploadCredsToMega(credsPath) {
    try {
        const storage = await new Storage({
  email: 'sdineth574@gmail.com', 
  password: 'senuradineth123'
}).ready
        console.log('Mega storage initialized.');
        if (!fs.existsSync(credsPath)) {
            throw new Error(`File not found: ${credsPath}`);
        }
       const fileSize = fs.statSync(credsPath).size;
        const uploadResult = await storage.upload({
            name: `${randomMegaId()}.json`,
            size: fileSize
        }, fs.createReadStream(credsPath)).complete;
        console.log('Session successfully uploaded to Mega.');
        const fileNode = storage.files[uploadResult.nodeId];
        const megaUrl = await fileNode.link();
        console.log(`Session Url: ${megaUrl}`);
        return megaUrl;
    } catch (error) {
        console.error('Error uploading to Mega:', error);
        throw error;
    }
}

router.get('/', async (req, res) => {
    const timestamp = generateTimestamp(); // Unique ID for the session
    const sessionDir = `./temp/${timestamp}`;
    const credsPath = `${sessionDir}/creds.json`;

    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    const phoneNumber = req.query.number;
    
    async function XploaderPair() {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        try {
            const SdbotsPair = makeWASocket({
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
                },
                logger: pino({ level: "fatal" }).child({ level: "fatal" }),
                printQRInTerminal: false,
                browser: Browsers.ubuntu('Edge'),
            });

            if (!SdbotsPair.authState.creds.registered) {
                await delay(1500);
                const sanitizedNumber = phoneNumber.replace(/[^0-9]/g, '');
                const code = await SdbotsPair.requestPairingCode(sanitizedNumber);
                if (!res.headersSent) {
                    res.send({ code });
                }
            }

            SdbotsPair.ev.on('creds.update', saveCreds);
            SdbotsPair.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect } = update;

                if (connection === 'open') {
                    console.log('Connection opened!');
                    try {
                        await delay(5000); // Wait for session stabilization
                        const megaUrl = await uploadCredsToMega(credsPath);

                        // Send the session ID to the user
                        const sessionId = megaUrl || 'Error: Mega URL not available';
                        await SdbotsPair.sendMessage(XpbotsPair.user.id, { text: sessionId });
                        console.log(`Session ID sent: ${sessionId}`);
                    } catch (error) {
                        console.error('Error during session handling:', error);
                    } finally {
                        // Clean up
                        await SdbotsPair.ws.close();
                        removeFolder(sessionDir);
                    }
                } else if (connection === 'close' && lastDisconnect && lastDisconnect.error && lastDisconnect.error.output.statusCode !== 401) {
                    console.log('Reconnecting...');
                    await delay(10000);
                    Senu_Md_Pair();
                }
            });
        } catch (error) {
            console.error('Error in Senu_Md_Pair:', error);
            removeFolder(sessionDir);
            if (!res.headersSent) {
                res.status(503).send({ code: 'Service Unavailable' });
            }
        }
    }

    await Senu_Md_Pair();
});

module.exports = router;
