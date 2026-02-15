
import PDFDocument from 'pdfkit';

export async function generateInvoicePDF(invoice, businessProfile) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        doc.on('error', (err) => {
            reject(err);
        });

        // --- Header ---
        doc
            .fontSize(20)
            .text(businessProfile?.businessName || 'Bharat Biz', { align: 'center' })
            .fontSize(10)
            .text(businessProfile?.address || 'India', { align: 'center' })
            .moveDown();

        // --- Invoice Info ---
        doc
            .fontSize(12)
            .text(`Invoice Number: ${invoice.id}`, 50, 150)
            .text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 50, 165)
            .text(`Customer: ${invoice.customer_name}`, 300, 150)
            .text(`Phone: ${invoice.customer_phone || 'N/A'}`, 300, 165)
            .moveDown();

        // --- Table Header ---
        const tableTop = 220;
        doc
            .font('Helvetica-Bold')
            .text('Item', 50, tableTop)
            .text('Quantity', 250, tableTop)
            .text('Price', 350, tableTop)
            .text('Total', 450, tableTop);

        doc
            .strokeColor('#aaaaaa')
            .lineWidth(1)
            .moveTo(50, tableTop + 15)
            .lineTo(550, tableTop + 15)
            .stroke();

        // --- Items ---
        let y = tableTop + 25;
        doc.font('Helvetica');

        invoice.items.forEach((item) => {
            const itemTotal = (item.quantity * item.price).toFixed(2);

            doc
                .text(item.description || item.name || 'Item', 50, y)
                .text(item.quantity.toString(), 250, y)
                .text(`Rs. ${item.price}`, 350, y)
                .text(`Rs. ${itemTotal}`, 450, y);

            y += 20;
        });

        doc
            .strokeColor('#aaaaaa')
            .lineWidth(1)
            .moveTo(50, y)
            .lineTo(550, y)
            .stroke();

        // --- Totals ---
        y += 20;
        doc
            .font('Helvetica-Bold')
            .text(`Subtotal: Rs. ${invoice.amount}`, 350, y)
            .text(`GST (18%): Rs. ${invoice.gstAmount?.toFixed(2) || '0.00'}`, 350, y + 20)
            .fontSize(14)
            .text(`Total: Rs. ${invoice.totalWithGST?.toFixed(2) || invoice.amount}`, 350, y + 45);

        // --- Footer ---
        doc
            .fontSize(10)
            .font('Helvetica')
            .text('Thank you for your business!', 50, 700, { align: 'center', width: 500 });

        doc.end();
    });
}
