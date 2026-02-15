
// Native fetch is used (Node 18+)

async function testNLP() {
    const baseUrl = 'http://localhost:3000/api';
    const uniqueUser = `testuser_${Date.now()}`;
    const password = 'password123';

    console.log(`1. Registering User: ${uniqueUser}...`);
    const regRes = await fetch(`${baseUrl}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test Setup',
            phone: uniqueUser,
            password: password,
            businessName: 'My Juice Shop'
        })
    });

    const regData = await regRes.json();
    if (!regData.token) {
        // Try login if already exists
        console.log("   User might exist, trying login...");
        const loginRes = await fetch(`${baseUrl}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: uniqueUser, password: password })
        });
        const loginData = await loginRes.json();
        if (!loginData.token) {
            console.error("❌ Auth Failed:", loginData);
            return;
        }
        regData.token = loginData.token;
    }
    console.log("✅ Auth Success! Token received.");

    console.log("\n2. Sending Natural Language Command: 'Raju ka bill bana do 500 rupay ka'");
    const chatRes = await fetch(`${baseUrl}/agent/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${regData.token}`
        },
        body: JSON.stringify({
            message: "Raju ka bill bana do 500 rupay ka",
            history: [] // simulate fresh chat
        })
    });

    const chatData = await chatRes.json();
    console.log("\n⬇️  NLP RESPONSE  ⬇️");
    console.log(JSON.stringify(chatData, null, 2));

    if (chatData.intent === 'CREATE_INVOICE' && chatData.params?.amount == 500) {
        console.log("\n✅ SUCCESS: Natural Language Correctly Processed!");
    } else {
        console.log("\n⚠️ CHECK: Intent verification needed.");
    }
}

testNLP();
