const Database = require("../database");

class DatabaseService {

    /**
     * Get database size
     * @returns {Promise<number>} Database size
     */
    static async getSize() {
        return await Database.getSize();
    }

    /**
     * Shrink the database
     * @returns {Promise<void>}
     */
    static async shrink() {
        await Database.shrink();
    }
}

module.exports = DatabaseService;
