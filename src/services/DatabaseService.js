const DB_NAME = 'MediaTrackDB';
const DB_VERSION = 1;

export class DatabaseService {
    constructor() {
        this.db = null;
    }

    async connect() {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = (event) => {
                console.error('Database error:', event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Patients Store
                if (!db.objectStoreNames.contains('patients')) {
                    db.createObjectStore('patients', { keyPath: 'id', autoIncrement: true });
                }

                // Medicines Store
                if (!db.objectStoreNames.contains('medicines')) {
                    db.createObjectStore('medicines', { keyPath: 'id', autoIncrement: true });
                }

                // Deliveries Store
                if (!db.objectStoreNames.contains('deliveries')) {
                    const deliveryStore = db.createObjectStore('deliveries', { keyPath: 'id', autoIncrement: true });
                    deliveryStore.createIndex('patientId', 'patientId', { unique: false });
                    deliveryStore.createIndex('date', 'scheduledDate', { unique: false });
                }
            };
        });
    }

    async getAll(storeName) {
        await this.connect();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getById(storeName, id) {
        await this.connect();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async add(storeName, data) {
        await this.connect();
        // Clonar datos para eliminar Proxies de Vue que causan errores en IndexedDB
        const cleanData = JSON.parse(JSON.stringify(data));
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(cleanData);

            request.onsuccess = () => resolve(request.result); // Returns the new ID
            request.onerror = () => reject(request.error);
        });
    }

    async update(storeName, data) {
        await this.connect();
        // Clonar datos para eliminar Proxies de Vue que causan errores en IndexedDB
        const cleanData = JSON.parse(JSON.stringify(data));
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(cleanData);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async delete(storeName, id) {
        await this.connect();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export const dbService = new DatabaseService();
