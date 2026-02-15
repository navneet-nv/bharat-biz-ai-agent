
const fs = require('fs');
const path = require('path');
// Manually parse .env.local
try {
    const envConfig = fs.readFileSync(path.resolve(process.cwd(), '.env.local'), 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
} catch (e) {
    console.warn("⚠️ Could not read .env.local");
}

const API_KEY = process.env.OPENAI_API_KEY || process.env.BHARATBIZ_LLM_KEY;

async function testWhisper() {
    console.log("1. Checking API Key Configuration...");
    if (!API_KEY) {
        console.error("❌ Error: No OPENAI_API_KEY found in .env.local");
        return;
    }
    console.log(`   Key found: ${API_KEY.substring(0, 5)}...******`);

    console.log("\n2. Preparing Dummy Audio (WAV Header + Silence)...");
    // Create a minimal valid WAV buffer (44 bytes header + 0 bytes data)
    // This might fail translation because it's silent, but it tests the handshake.
    const wavHeader = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // "RIFF"
        0x24, 0x00, 0x00, 0x00, // ChunkSize (36 + data)
        0x57, 0x41, 0x56, 0x45, // "WAVE"
        0x66, 0x6d, 0x74, 0x20, // "fmt "
        0x10, 0x00, 0x00, 0x00, // Subchunk1Size (16 for PCM)
        0x01, 0x00,             // AudioFormat (1 = PCM)
        0x01, 0x00,             // NumChannels (1)
        0x44, 0xac, 0x00, 0x00, // SampleRate (44100)
        0x88, 0x58, 0x01, 0x00, // ByteRate
        0x02, 0x00,             // BlockAlign
        0x10, 0x00,             // BitsPerSample (16)
        0x64, 0x61, 0x74, 0x61, // "data"
        0x00, 0x00, 0x00, 0x00  // Subchunk2Size (0 bytes of data)
    ]);

    // Add some silence to make it valid for Whisper (it often rejects empty files)
    const silence = Buffer.alloc(1024, 0);
    const fileBuffer = Buffer.concat([wavHeader, silence]);

    const blob = new Blob([fileBuffer], { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('file', blob, 'test_silence.wav');
    formData.append('model', 'whisper-1');
    formData.append('language', 'hi');

    console.log("\n3. Sending Request to OpenAI Whisper API...");
    try {
        const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            },
            body: formData
        });

        const rawText = await response.text();
        console.log("\n⬇️  RESPONSE RAW BODY  ⬇️");
        console.log(rawText);

        if (!response.ok) {
            console.error(`\n❌ API Error: Status ${response.status}`);
        } else {
            console.log("\n✅ API Success! (Note: 'Silence' might return empty text or hallucination, but checking if connection worked)");
        }

    } catch (e) {
        console.error("❌ Network/Script Error:", e);
    }
}

testWhisper();
