
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const contentType = request.headers.get('content-type');
        let body;

        if (contentType.includes('application/json')) {
            body = await request.json();
        } else {
            // Handle form-urlencoded (Twilio standard)
            const formData = await request.formData();
            body = Object.fromEntries(formData);
        }

        const { From, Body } = body;

        console.log(`[WhatsApp Mock] Received message from ${From}: ${Body}`);

        // In a real scenario, this would trigger the Agent Logic asynchronously
        // For now, we just acknowledge receipt

        return new NextResponse('<Response></Response>', {
            headers: { 'Content-Type': 'text/xml' } // Twilio expects XML
        });

    } catch (error) {
        console.error('WhatsApp Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
