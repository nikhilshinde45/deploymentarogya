const schemas = require('./validation/schemas');
console.log("Schemas loaded successfully");
const validate = require('./middleware/validate');

const req = {
    body: {
        name: "Ab",
        email: "test@gmail.com",
        password: "Password123!",
        role: "patient"
    }
};

const res = {
    status: (code) => ({
        json: (data) => console.log(`Responded with ${code}:`, data)
    })
};

const next = () => console.log("Next called");

validate(schemas.registerUserSchema)(req, res, next);
