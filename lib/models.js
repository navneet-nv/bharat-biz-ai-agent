
// Basic Schema Validation Helpers for MongoDB
// Since we are using native driver, these ensure consistency

export const UserSchema = {
    validate: (data) => {
        if (!data.phone) throw new Error("Phone is required");
        if (!data.password) throw new Error("Password is required");
        return {
            name: data.name || '',
            phone: data.phone,
            businessName: data.businessName || '',
            password: data.password, // Hashed
            role: 'merchant', // default
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }
};

export const BusinessProfileSchema = {
    validate: (data) => {
        return {
            userId: data.userId, // Link to User
            businessType: data.businessType || 'retail', // e.g. 'juice_shop', 'pharmacy'
            gstin: data.gstin || null,
            address: data.address || '',
            preferredLanguage: data.preferredLanguage || 'hinglish',
            settings: {
                whatsappEnabled: data.whatsappEnabled || false,
                lowStockThreshold: data.lowStockThreshold || 10
            },
            updatedAt: new Date().toISOString()
        };
    }
};

export const CustomerSchema = {
    validate: (data) => {
        if (!data.phone) throw new Error("Customer phone is required");
        return {
            userId: data.userId,
            name: data.name || 'Unknown',
            phone: data.phone,
            totalInvoices: 0,
            totalAmount: 0,
            pendingAmount: 0, // Udhaar
            lastInteraction: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
    }
};
