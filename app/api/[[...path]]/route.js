import { MongoClient, ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const MONGO_URL = process.env.MONGO_URL;
const DB_NAME = process.env.DB_NAME;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_demo_only_do_not_use_in_production';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const BHARATBIZ_LLM_KEY = process.env.BHARATBIZ_LLM_KEY;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;

let cachedDb = null;

import { connectToDatabase } from '@/lib/db';
import { UserSchema, CustomerSchema, BusinessProfileSchema } from '@/lib/models';
import { classifyIntent, getOpenAIClient } from '@/lib/agent/intent';
import { executeIntent } from '@/lib/agent/executor';
import { generateInvoicePDF } from '@/lib/invoice/generator';
import { sendEmail } from '@/lib/email/sender';

// Verify JWT Token
function verifyToken(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');

  try {
    const { db } = await connectToDatabase();

    // Public routes
    if (path === 'health') {
      return NextResponse.json({ status: 'ok', message: 'Bharat Biz-Agent API is running' });
    }

    // Protected routes - require authentication
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Dashboard Stats
    if (path === 'dashboard/stats') {
      const invoices = await db.collection('invoices')
        .find({ userId: user.userId })
        .toArray();

      const customers = await db.collection('customers')
        .find({ userId: user.userId })
        .toArray();

      const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
      const pendingPayments = invoices.filter(inv => inv.status === 'pending').length;

      return NextResponse.json({
        totalRevenue,
        totalInvoices: invoices.length,
        pendingPayments,
        totalCustomers: customers.length
      });
    }

    // Get all invoices
    if (path === 'invoices') {
      const limit = url.searchParams.get('limit');
      let query = db.collection('invoices')
        .find({ userId: user.userId })
        .sort({ createdAt: -1 });

      if (limit) {
        query = query.limit(parseInt(limit));
      }

      const invoices = await query.toArray();
      return NextResponse.json(invoices);
    }

    // Get single invoice
    if (path.startsWith('invoices/') && path.split('/').length === 2) {
      const invoiceId = path.split('/')[1];
      const invoice = await db.collection('invoices')
        .findOne({ id: invoiceId, userId: user.userId });

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      return NextResponse.json(invoice);
    }

    // Get all customers
    if (path === 'customers') {
      const customers = await db.collection('customers')
        .find({ userId: user.userId })
        .sort({ createdAt: -1 })
        .toArray();

      return NextResponse.json(customers);
    }

    // Get all payments
    if (path === 'payments') {
      const payments = await db.collection('payments')
        .find({ userId: user.userId })
        .sort({ createdAt: -1 })
        .toArray();

      return NextResponse.json(payments);
    }

    // Get all expenses
    if (path === 'expenses') {
      const expenses = await db.collection('expenses')
        .find({ userId: user.userId })
        .sort({ date: -1 })
        .toArray();
      return NextResponse.json(expenses);
    }

    // Get analytics
    if (path === 'analytics') {
      const invoices = await db.collection('invoices')
        .find({ userId: user.userId })
        .toArray();

      // Revenue by month
      const revenueByMonth = {};
      invoices.forEach(inv => {
        const month = new Date(inv.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        revenueByMonth[month] = (revenueByMonth[month] || 0) + inv.amount;
      });

      // Payment status breakdown
      const statusBreakdown = {
        paid: invoices.filter(inv => inv.status === 'paid').length,
        pending: invoices.filter(inv => inv.status === 'pending').length,
        overdue: invoices.filter(inv => inv.status === 'overdue').length
      };

      return NextResponse.json({
        revenueByMonth,
        statusBreakdown,
        totalRevenue: invoices.reduce((sum, inv) => sum + inv.amount, 0)
      });
    }

    // PDF Export (Real)
    if (path.includes('/') && path.endsWith('/pdf')) {
      const invoiceId = path.split('/')[1];
      const invoice = await db.collection('invoices').findOne({ id: invoiceId, userId: user.userId });

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      // Fetch Business Profile for Header
      const profile = await db.collection('business_profiles').findOne({ userId: user.userId });

      try {
        const pdBuffer = await generateInvoicePDF(invoice, profile);

        return new NextResponse(pdBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename=invoice_${invoiceId}.pdf`
          }
        });
      } catch (e) {
        console.error("PDF Gen Error", e);
        return NextResponse.json({ error: 'PDF Generation Failed' }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Route not found' }, { status: 404 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');

  try {
    const { db } = await connectToDatabase();

    let body = {};
    // Only parse JSON for non-file-upload routes
    if (path !== 'voice/transcribe') {
      try {
        body = await request.json();
      } catch (e) {
        // Ignore JSON parse error if body is empty or not JSON
      }
    }

    // Auth routes
    if (path === 'auth/signup') {
      const { name, phone, businessName, password } = body;

      // Check if user exists
      const existingUser = await db.collection('users').findOne({ phone });
      if (existingUser) {
        return NextResponse.json({ error: 'Phone number already registered' }, { status: 400 });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const userData = {
        name,
        phone,
        businessName,
        password: hashedPassword
      };

      const user = {
        id: uuidv4(),
        ...UserSchema.validate(userData)
      };

      await db.collection('users').insertOne(user);

      // Initialize Business Profile
      const businessProfile = BusinessProfileSchema.validate({
        userId: user.id,
        businessType: 'retail' // default
      });
      await db.collection('business_profiles').insertOne(businessProfile);

      return NextResponse.json({ message: 'User created successfully', userId: user.id });
    }

    if (path === 'auth/login') {
      const { phone, password } = body;

      const user = await db.collection('users').findOne({ phone });
      if (!user) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const token = jwt.sign(
        { userId: user.id, phone: user.phone },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      return NextResponse.json({
        token,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          businessName: user.businessName
        }
      });
    }

    // Protected routes
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create invoice
    if (path === 'invoices') {
      const { items } = body;

      // Update inventory if items exist and have product IDs
      if (items && Array.isArray(items)) {
        for (const item of items) {
          if (item.productId) {
            await db.collection('products').updateOne(
              { id: item.productId, userId: user.userId },
              { $inc: { stock: -item.quantity } }
            );
          }
        }
      }

      const invoice = {
        id: `INV-${Date.now()}`,
        userId: user.userId,
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        items: body.items,
        amount: body.amount,
        status: 'pending',
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        gstAmount: body.gstAmount || (body.amount * 0.18),
        totalWithGST: body.totalWithGST || (body.amount * 1.18)
      };

      await db.collection('invoices').insertOne(invoice);

      // Create or update customer
      const existingCustomer = await db.collection('customers').findOne({
        userId: user.userId,
        phone: body.customer_phone
      });

      if (!existingCustomer) {
        const customerData = CustomerSchema.validate({
          userId: user.userId,
          name: body.customer_name,
          phone: body.customer_phone
        });

        await db.collection('customers').insertOne({
          id: uuidv4(),
          ...customerData,
          totalInvoices: 1,
          totalAmount: body.amount,
          pendingAmount: body.amount
        });
      } else {
        await db.collection('customers').updateOne(
          { _id: existingCustomer._id },
          {
            $inc: {
              totalInvoices: 1,
              totalAmount: body.amount,
              pendingAmount: body.amount
            }
          }
        );
      }

      return NextResponse.json({ message: 'Invoice created successfully', invoice });
    }

    // Add/Update product
    if (path === 'products') {
      const { id, name, sku, price, stock, category } = body;

      if (id) {
        await db.collection('products').updateOne(
          { id, userId: user.userId },
          { $set: { name, sku, price, stock, category, updatedAt: new Date().toISOString() } }
        );
        return NextResponse.json({ message: 'Product updated successfully' });
      } else {
        const product = {
          id: uuidv4(),
          userId: user.userId,
          name,
          sku,
          price,
          stock,
          category,
          createdAt: new Date().toISOString()
        };
        await db.collection('products').insertOne(product);
        return NextResponse.json({ message: 'Product added successfully', product });
      }
    }

    // OCR / UPI Screenshot Analysis
    if (path === 'ocr/analyze') {
      const { image } = body; // Base64 or URL

      // CHECK FOR API KEY
      if (!process.env.OPENAI_API_KEY && !process.env.BHARATBIZ_LLM_KEY) {
        console.log("⚠️ No OpenAI Key. Using Mock OCR.");
        // Return a realistic mock response for demo
        return NextResponse.json({
          type: 'bill',
          totalAmount: 1250,
          date: new Date().toISOString(),
          customer_name: "Cash Customer",
          vendor_name: "Wholesale Market",
          items: [
            { description: "Potatoes (50kg)", quantity: 50, price: 25 }
          ]
        });
      }

      try {
        const ocrResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini", // Optimized for cost
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: "You are an expert OCR agent. Extract data from this business bill or UPI screenshot into JSON: { type: 'bill'|'upi', totalAmount: number, date: string, items: [{ description: string, quantity: number, price: number }], customer_name: string, vendor_name: string }" },
                  { type: "image_url", image_url: { url: image } }
                ]
              }
            ],
            max_tokens: 500
          })
        });

        const ocrResult = await ocrResponse.json();
        return NextResponse.json(ocrResult.choices[0].message.content);
      } catch (e) {
        return NextResponse.json({ error: 'OCR processing failed' }, { status: 500 });
      }
    }

    // Add customer
    if (path === 'customers') {
      const customer = {
        id: uuidv4(),
        userId: user.userId,
        name: body.name,
        phone: body.phone,
        email: body.email,
        address: body.address,
        totalInvoices: 0,
        totalAmount: 0,
        pendingAmount: 0,
        createdAt: new Date().toISOString()
      };

      await db.collection('customers').insertOne(customer);
      return NextResponse.json({ message: 'Customer added successfully', customer });
    }

    // AI Agent conversation
    if (path === 'agent/chat') {
      const { message, language } = body;

      // 1. Classify Intent
      const classification = await classifyIntent(message);

      // 2. Handle Confirmation
      if (classification.needsConfirmation) {
        // In a real app, store this state in DB/Redis with a sessionId
        // For now, we return the question to the UI
        return NextResponse.json({
          intent: classification.intent,
          message: classification.replyMessage + " (Reply 'Yes' to confirm)",
          needsConfirmation: true,
          params: classification.params
        });
      }

      // 3. Execute immediately if high confidence / safe
      // OR if user said "Yes" (Client needs to handle sending the previous context back, 
      // but for this MVP let's assume "Yes" triggers a hardcoded simulated action or we use the params if provided)

      // Basic "Yes" handling simulation
      if (message.toLowerCase() === 'yes') {
        return NextResponse.json({
          message: "Confirmed! (Simulation: Action executed)",
          intent: "CONFIRMED",
          needsConfirmation: false
        });
      }

      // Execute Action
      const result = await executeIntent(classification.intent, user.userId, classification.params);

      return NextResponse.json({
        intent: classification.intent,
        message: result.message || classification.replyMessage,
        actionResult: result.data || result,
        needsConfirmation: false
      });
    }

    // Send WhatsApp reminder
    if (path.startsWith('payments/') && path.endsWith('/remind')) {
      const invoiceId = path.split('/')[1];

      const invoice = await db.collection('invoices').findOne({
        id: invoiceId,
        userId: user.userId
      });

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      // Send WhatsApp message via Twilio
      if (TWILIO_AUTH_TOKEN && TWILIO_AUTH_TOKEN !== 'your_twilio_auth_token_here') {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

        const whatsappBody = new URLSearchParams({
          From: TWILIO_WHATSAPP_NUMBER,
          To: `whatsapp:${invoice.customer_phone}`,
          Body: `नमस्ते ${invoice.customer_name},\n\nYour payment of ₹${invoice.amount} for Invoice #${invoice.id} is pending.\n\nकृपया जल्द से जल्द भुगतान करें।\n\nThank you!\n- ${user.businessName || 'Bharat Biz'}`
        });

        try {
          const twilioResponse = await fetch(twilioUrl, {
            method: 'POST',
            headers: {
              'Authorization': 'Basic ' + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64'),
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: whatsappBody
          });

          if (twilioResponse.ok) {
            return NextResponse.json({ message: 'Reminder sent successfully via WhatsApp' });
          } else {
            const error = await twilioResponse.text();
            console.error('Twilio error:', error);
            return NextResponse.json({ message: 'Reminder logged (WhatsApp not configured)' });
          }
        } catch (error) {
          console.error('WhatsApp send error:', error);
          return NextResponse.json({ message: 'Reminder logged (WhatsApp error)' });
        }
      } else {
        // Log reminder without sending
        await db.collection('reminders').insertOne({
          invoiceId: invoice.id,
          customerId: invoice.customer_phone,
          sentAt: new Date().toISOString(),
          method: 'whatsapp',
          status: 'pending'
        });

        return NextResponse.json({ message: 'Reminder logged (Configure Twilio to send)' });
      }
    }

    // Send Invoice via Email/WhatsApp
    if (path.startsWith('invoices/') && path.endsWith('/send')) {
      const invoiceId = path.split('/')[1];
      const invoice = await db.collection('invoices').findOne({ id: invoiceId, userId: user.userId });

      if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

      const profile = await db.collection('business_profiles').findOne({ userId: user.userId });
      const pdfBuffer = await generateInvoicePDF(invoice, profile);

      // Send Email
      // In production we would check if customer has email
      const customerEmail = "customer@example.com"; // Placeholder or fetch from customer record

      const emailResult = await sendEmail({
        to: customerEmail,
        subject: `Invoice #${invoice.id} from ${profile?.businessName || 'Bharat Biz'}`,
        text: `Dear ${invoice.customer_name},\n\nPlease find attached your invoice.\nTotal: Rs. ${invoice.totalWithGST}\n\nThank you.`,
        attachments: [{ filename: `invoice_${invoice.id}.pdf`, content: pdfBuffer }]
      });

      // Update status
      await db.collection('invoices').updateOne(
        { id: invoiceId },
        { $set: { status: 'sent', sentAt: new Date().toISOString() } }
      );

      return NextResponse.json({ message: 'Invoice send initiated', emailResult });
    }

    // Text to Speech (TTS)
    if (path === 'voice/speak') {
      try {
        const { text } = body;
        if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });

        // MOCK FALLBACK if no API Key
        if (!process.env.OPENAI_API_KEY && !process.env.BHARATBIZ_LLM_KEY) {
          console.log("⚠️ No OpenAI Key found. Using Mock TTS.");
          // Return a dummy audio file (base64 of a short silent mp3 or similar, or just text to simulate)
          // For now, we'll return a specific error code that frontend can handle by using browser TTS
          return NextResponse.json({ error: 'TTS API Key Missing', useBrowserTTS: true }, { status: 424 });
        }

        const mp3 = await getOpenAIClient().audio.speech.create({
          model: "gpt-4o-mini-tts-2025-12-15",
          voice: "alloy",
          input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'audio/mpeg',
            'Content-Length': buffer.length,
          },
        });

      } catch (error) {
        console.error('TTS Error:', error);
        return NextResponse.json({ error: 'TTS Failed', details: error.message }, { status: 500 });
      }
    }

    // Voice to text with Whisper
    if (path === 'voice/transcribe') {
      try {
        const formData = await request.formData();
        const audioFile = formData.get('audio');

        if (!audioFile) {
          return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
        }

        // MOCK FALLBACK if no API Key (to prevent crashes in demo)
        if (!process.env.OPENAI_API_KEY && !process.env.BHARATBIZ_LLM_KEY) {
          console.log("⚠️ No OpenAI Key found. Using Mock Transcription.");
          return NextResponse.json({ text: "Add expense 50 rupees for Chai" });
        }

        const audioBuffer = await audioFile.arrayBuffer();
        console.log(`Received Audio: ${audioBuffer.byteLength} bytes`);
        const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' });

        const whisperFormData = new FormData();
        whisperFormData.append('file', audioBlob, 'audio.webm');
        whisperFormData.append('model', 'whisper-1');
        whisperFormData.append('language', 'hi');
        whisperFormData.append('prompt', 'Transcribe Hinglish (Hindi + English mix). Business context: udhaar, bill, payment.');

        // Call OpenAI Whisper API
        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY || process.env.BHARATBIZ_LLM_KEY}`
          },
          body: whisperFormData
        });

        if (!whisperResponse.ok) {
          // Fallback to mock on API error
          console.warn("Whisper API failed. Using Mock.");
          return NextResponse.json({ text: "Apple 5kg paanch sau rupay (Mock: whisper failed)" });
        }

        const rawText = await whisperResponse.text();
        console.log("Whisper Raw Response:", rawText);

        let transcription;
        try {
          transcription = JSON.parse(rawText);
        } catch (e) {
          console.error("JSON Parse Error:", e);
          throw new Error("Invalid JSON from Whisper API");
        }
        return NextResponse.json({ text: transcription.text });

      } catch (error) {
        console.error('Voice transcription error:', error);
        // Fallback on system error
        return NextResponse.json({ text: "Error in transcription (Mock Fallback)" });
      }
    }

    return NextResponse.json({ error: 'Route not found' }, { status: 404 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');

  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();
    const body = await request.json();

    // Update invoice status
    if (path.startsWith('invoices/')) {
      const invoiceId = path.split('/')[1];

      const result = await db.collection('invoices').updateOne(
        { id: invoiceId, userId: user.userId },
        { $set: { status: body.status, updatedAt: new Date().toISOString() } }
      );

      if (result.matchedCount === 0) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Invoice updated successfully' });
    }

    return NextResponse.json({ error: 'Route not found' }, { status: 404 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/', '');

  try {
    const user = verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { db } = await connectToDatabase();

    // Delete invoice
    if (path.startsWith('invoices/')) {
      const invoiceId = path.split('/')[1];

      const result = await db.collection('invoices').deleteOne({
        id: invoiceId,
        userId: user.userId
      });

      if (result.deletedCount === 0) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      return NextResponse.json({ message: 'Invoice deleted successfully' });
    }

    return NextResponse.json({ error: 'Route not found' }, { status: 404 });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}