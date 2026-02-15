
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    // In a real production app, verify a secret key header to prevent unauthorized scanning
    // const authHeader = request.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

    try {
        const { db } = await connectToDatabase();

        // Find invoices pending for more than 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const overdueInvoices = await db.collection('invoices').find({
            status: 'pending',
            createdAt: { $lt: sevenDaysAgo.toISOString() }
        }).toArray();

        return NextResponse.json({
            success: true,
            count: overdueInvoices.length,
            invoices: overdueInvoices.map(inv => ({
                id: inv.id,
                customer: inv.customer_name,
                amount: inv.amount,
                daysOverdue: Math.floor((new Date() - new Date(inv.createdAt)) / (1000 * 60 * 60 * 24))
            }))
        });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
