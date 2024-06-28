class ReportNotFoundError extends Error {
    /**
     * @constructor
     * @param {string} message 
     * @param {import("./errors").Meta} meta 
     */
    constructor(message, meta) {
        super(message);
        this.meta = meta;
    }
}

module.exports = {
    ReportNotFoundError
};
