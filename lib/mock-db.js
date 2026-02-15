
// In-Memory Mock Database for Demo/Fallback
// mimicking the MongoDB Node.js driver API

class MockCollection {
    constructor(name, db) {
        this.name = name;
        this.db = db;
        this.data = [];
    }

    find(query = {}) {
        const results = this.filterData(query);
        return new MockCursor(results);
    }

    async findOne(query = {}) {
        const results = this.filterData(query);
        return results.length > 0 ? results[0] : null;
    }

    async insertOne(doc) {
        const newDoc = { ...doc, _id: doc._id || `mock_id_${Date.now()}_${Math.random()}` };
        this.data.push(newDoc);
        return { insertedId: newDoc._id, acknowledged: true };
    }

    async updateOne(filter, update) {
        const doc = await this.findOne(filter);
        if (!doc) return { matchedCount: 0, modifiedCount: 0 };

        // Handle $set
        if (update.$set) {
            Object.assign(doc, update.$set);
        }
        // Handle $inc
        if (update.$inc) {
            for (const key in update.$inc) {
                if (doc[key] !== undefined) {
                    doc[key] += update.$inc[key];
                } else {
                    doc[key] = update.$inc[key];
                }
            }
        }

        return { matchedCount: 1, modifiedCount: 1, acknowledged: true };
    }

    async deleteOne(filter) {
        const index = this.data.findIndex(item => this.matches(item, filter));
        if (index === -1) return { deletedCount: 0, acknowledged: true };

        this.data.splice(index, 1);
        return { deletedCount: 1, acknowledged: true };
    }

    // Helper: Simple filter matching
    filterData(query) {
        return this.data.filter(item => this.matches(item, query));
    }

    matches(item, query) {
        for (const key in query) {
            if (item[key] !== query[key]) {
                return false;
            }
        }
        return true;
    }
}

class MockCursor {
    constructor(data) {
        this.data = data;
    }

    sort(sortOptions) {
        // Simple sort implementation
        const keys = Object.keys(sortOptions);
        if (keys.length === 0) return this;

        const key = keys[0];
        const direction = sortOptions[key]; // 1 or -1

        this.data.sort((a, b) => {
            if (a[key] < b[key]) return -1 * direction;
            if (a[key] > b[key]) return 1 * direction;
            return 0;
        });

        return this;
    }

    limit(n) {
        this.data = this.data.slice(0, n);
        return this;
    }

    async toArray() {
        return this.data;
    }
}

class MockDB {
    constructor() {
        this.collections = {};
    }

    collection(name) {
        if (!this.collections[name]) {
            this.collections[name] = new MockCollection(name, this);
        }
        return this.collections[name];
    }
}

// Singleton instance
let mockDbInstance = null;

export function getMockDB() {
    if (!mockDbInstance) {
        mockDbInstance = new MockDB();
        console.log("⚠️  Initialized In-Memory Mock Database");
        seedMockData(mockDbInstance);
    }
    return {
        db: mockDbInstance,
        client: { close: () => { } } // Mock client
    };
}

// Optional: Seed with some demo data
function seedMockData(db) {
    const users = db.collection('users');
    users.insertOne({
        phone: "9876543210",
        password: "$2b$10$6yVaTofRbUpm.4mcEbVvP.53.b.zRFtIdTyDhTt9UsFLpjS5W66Ta", // password123
        name: "Demo User",
        businessName: "Demo Kirana Store"
    });
}
