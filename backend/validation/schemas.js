const { z } = require('zod');

const passwordValidation = z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/\d/, 'Password must contain at least one number')
    .regex(/[@$!%*?&]/, 'Password must contain at least one special character (@, $, !, %, *, ?, &)');

const emailValidation = z
    .string()
    .email('Invalid email format')
    .refine((email) => email.endsWith('@gmail.com'), {
        message: 'Email must end with @gmail.com',
    });

const registerUserSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long').nonempty('Name is required'),
    email: emailValidation,
    password: passwordValidation,
    role: z.enum(['patient', 'doctor', 'admin', 'pharmacist']).optional(),
});

const loginSchema = z.object({
    email: emailValidation,
    password: z.string().min(1, 'Password is required'),
});

const addDoctorSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long').nonempty('Name is required'),
    email: emailValidation,
    password: passwordValidation,
    specialization: z.string().nonempty('Specialization is required'),
    experience: z.coerce.number().min(0, 'Experience must be a positive number'),
    bio: z.string().optional(),
});

const addPharmacistSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long').nonempty('Name is required'),
    email: emailValidation,
    password: passwordValidation,
    licenseNumber: z.string().nonempty('License Number is required'),
    experience: z.coerce.number().min(0, 'Experience must be a positive number').optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
});

module.exports = {
    registerUserSchema,
    loginSchema,
    addDoctorSchema,
    addPharmacistSchema,
};
