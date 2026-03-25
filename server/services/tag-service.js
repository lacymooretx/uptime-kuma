const { R } = require("redbean-node");

class TagService {

    /**
     * Get all tags
     * @returns {Promise<object[]>} List of tags as JSON
     */
    static async list() {
        const list = await R.findAll("tag");
        return list.map((bean) => bean.toJSON());
    }

    /**
     * Add a new tag
     * @param {object} tag Tag data {name, color}
     * @returns {Promise<object>} Created tag as JSON
     */
    static async add(tag) {
        let bean = R.dispense("tag");
        bean.name = tag.name;
        bean.color = tag.color;
        await R.store(bean);
        return await bean.toJSON();
    }

    /**
     * Edit a tag
     * @param {object} tag Tag data {id, name, color}
     * @returns {Promise<object>} Updated tag as JSON
     * @throws {Error} If tag not found
     */
    static async edit(tag) {
        let bean = await R.findOne("tag", " id = ? ", [tag.id]);
        if (bean == null) {
            throw new Error("tagNotFound");
        }
        bean.name = tag.name;
        bean.color = tag.color;
        await R.store(bean);
        return await bean.toJSON();
    }

    /**
     * Delete a tag
     * @param {number} tagID Tag ID to delete
     * @returns {Promise<void>}
     */
    static async delete(tagID) {
        await R.exec("DELETE FROM tag WHERE id = ? ", [tagID]);
    }

    /**
     * Add a tag to a monitor
     * @param {number} tagID Tag ID
     * @param {number} monitorID Monitor ID
     * @param {string} value Tag value
     * @returns {Promise<void>}
     */
    static async addMonitorTag(tagID, monitorID, value) {
        await R.exec("INSERT INTO monitor_tag (tag_id, monitor_id, value) VALUES (?, ?, ?)", [
            tagID,
            monitorID,
            value,
        ]);
    }

    /**
     * Edit a monitor tag value
     * @param {number} tagID Tag ID
     * @param {number} monitorID Monitor ID
     * @param {string} value New tag value
     * @returns {Promise<void>}
     */
    static async editMonitorTag(tagID, monitorID, value) {
        await R.exec("UPDATE monitor_tag SET value = ? WHERE tag_id = ? AND monitor_id = ?", [
            value,
            tagID,
            monitorID,
        ]);
    }

    /**
     * Delete a tag from a monitor
     * @param {number} tagID Tag ID
     * @param {number} monitorID Monitor ID
     * @param {string} value Tag value
     * @returns {Promise<void>}
     */
    static async deleteMonitorTag(tagID, monitorID, value) {
        await R.exec("DELETE FROM monitor_tag WHERE tag_id = ? AND monitor_id = ? AND value = ?", [
            tagID,
            monitorID,
            value,
        ]);
    }
}

module.exports = TagService;
