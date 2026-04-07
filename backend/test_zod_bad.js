const schemas = require('./validation/schemas');
console.log("Schemas loaded successfully");
const validate = require('./middleware/validate');

const req = {
    body: {
        name: "Ab",
        email: "test_gmail.com", // BAD EMAIL
        password: "Pass",        // BAD PASSWORD
        role: "patient"
    }
};

const res = {
    status: (code) => {
        console.log(`Setting status ${code}`);
        return {
            json: (data) => console.log(`Responded with ${code}:`, JSON.stringify(data))
        };
    }
};

const next = () => console.log("Next called");

validate(schemas.registerUserSchema)(req, res, next);
