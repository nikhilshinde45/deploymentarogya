const validate = (schema) => (req, res, next) => {
    try {
        schema.parse(req.body);
        next();
    } catch (err) {
        if (err.errors || err.issues) {
            const validationList = err.errors || err.issues;
            const errors = validationList.map((error) => ({
                path: error.path.join('.'),
                message: error.message,
            }));
            return res.status(400).json({ success: false, message: "Validation Failed", errors });
        }
        console.error("Validation Middleware Error:", err);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: err.message });
    }
};

module.exports = validate;
