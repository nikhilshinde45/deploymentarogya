const swaggerUi = require('swagger-ui-express');

const apiBaseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;

const openApiSpec = {
    openapi: '3.0.3',
    info: {
        title: 'ArogyaAi Backend API',
        version: '1.0.0',
        description: 'Centralized OpenAPI documentation for all ArogyaAi backend routes.'
    },
    servers: [
        {
            url: apiBaseUrl,
            description: 'Local development server'
        }
    ],
    tags: [
        { name: 'Auth' },
        { name: 'Admin' },
        { name: 'Doctor Auth' },
        { name: 'Pharmacist Auth' },
        { name: 'Doctors' },
        { name: 'Appointments' },
        { name: 'Medical Records' },
        { name: 'Records' },
        { name: 'Medicines' }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        },
        schemas: {
            MessageResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string' }
                }
            },
            GenericObject: {
                type: 'object',
                additionalProperties: true
            }
        }
    },
    paths: {
        '/api/auth/login': {
            post: {
                tags: ['Auth'],
                summary: 'Login patient user',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/GenericObject' }
                        }
                    }
                },
                responses: {
                    200: { description: 'Login successful' },
                    401: { description: 'Invalid credentials' }
                }
            }
        },
        '/api/auth/register': {
            post: {
                tags: ['Auth'],
                summary: 'Register patient user',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/GenericObject' }
                        }
                    }
                },
                responses: {
                    201: { description: 'Registration successful' },
                    400: { description: 'Validation error' }
                }
            }
        },
        '/api/admin/login': {
            post: {
                tags: ['Admin'],
                summary: 'Admin login',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/GenericObject' }
                        }
                    }
                },
                responses: {
                    200: { description: 'Login successful' },
                    401: { description: 'Invalid credentials' }
                }
            }
        },
        '/api/admin/doctors': {
            post: {
                tags: ['Admin'],
                summary: 'Add doctor',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: { $ref: '#/components/schemas/GenericObject' }
                        }
                    }
                },
                responses: {
                    201: { description: 'Doctor created' },
                    403: { description: 'Admin only' }
                }
            }
        },
        '/api/admin/doctors/{id}': {
            put: {
                tags: ['Admin'],
                summary: 'Update doctor',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: { $ref: '#/components/schemas/GenericObject' }
                        }
                    }
                },
                responses: {
                    200: { description: 'Doctor updated' }
                }
            },
            delete: {
                tags: ['Admin'],
                summary: 'Delete doctor',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Doctor deleted' }
                }
            }
        },
        '/api/admin/pharmacists': {
            get: {
                tags: ['Admin'],
                summary: 'Get all pharmacists',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'List of pharmacists' }
                }
            },
            post: {
                tags: ['Admin'],
                summary: 'Add pharmacist',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: { $ref: '#/components/schemas/GenericObject' }
                        }
                    }
                },
                responses: {
                    201: { description: 'Pharmacist created' }
                }
            }
        },
        '/api/admin/pharmacists/{id}': {
            put: {
                tags: ['Admin'],
                summary: 'Update pharmacist',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    required: true,
                    content: {
                        'multipart/form-data': {
                            schema: { $ref: '#/components/schemas/GenericObject' }
                        }
                    }
                },
                responses: {
                    200: { description: 'Pharmacist updated' }
                }
            },
            delete: {
                tags: ['Admin'],
                summary: 'Delete pharmacist',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Pharmacist deleted' }
                }
            }
        },
        '/api/doctor/login': {
            post: {
                tags: ['Doctor Auth'],
                summary: 'Doctor login',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/GenericObject' }
                        }
                    }
                },
                responses: {
                    200: { description: 'Login successful' }
                }
            }
        },
        '/api/pharmacist/login': {
            post: {
                tags: ['Pharmacist Auth'],
                summary: 'Pharmacist login',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/GenericObject' }
                        }
                    }
                },
                responses: {
                    200: { description: 'Login successful' }
                }
            }
        },
        '/api/doctors': {
            get: {
                tags: ['Doctors'],
                summary: 'Get all doctors',
                responses: {
                    200: { description: 'List of doctors' }
                }
            }
        },
        '/api/doctors/{doctorId}': {
            get: {
                tags: ['Doctors'],
                summary: 'Get doctor by id',
                parameters: [{ name: 'doctorId', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Doctor details' },
                    404: { description: 'Doctor not found' }
                }
            }
        },
        '/api/appointments/slots': {
            post: {
                tags: ['Appointments'],
                summary: 'Create appointment slots (doctor only)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/GenericObject' }
                        }
                    }
                },
                responses: {
                    201: { description: 'Slots created' },
                    403: { description: 'Doctor only' }
                }
            }
        },
        '/api/appointments/slots/{doctorId}': {
            get: {
                tags: ['Appointments'],
                summary: 'Get available slots by doctor',
                parameters: [{ name: 'doctorId', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Available slots' }
                }
            }
        },
        '/api/appointments/book': {
            post: {
                tags: ['Appointments'],
                summary: 'Book appointment (patient only)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/GenericObject' }
                        }
                    }
                },
                responses: {
                    201: { description: 'Appointment booked' },
                    403: { description: 'Patient only' }
                }
            }
        },
        '/api/appointments/{appointmentId}/cancel': {
            patch: {
                tags: ['Appointments'],
                summary: 'Cancel appointment',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'appointmentId', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Appointment cancelled' }
                }
            }
        },
        '/api/appointments/upcoming': {
            get: {
                tags: ['Appointments'],
                summary: 'Get upcoming appointments for logged-in user',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Upcoming appointments' }
                }
            }
        },
        '/api/appointments/patient': {
            get: {
                tags: ['Appointments'],
                summary: 'Get logged-in patient appointments',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Patient appointments' }
                }
            }
        },
        '/api/appointments/doctor': {
            get: {
                tags: ['Appointments'],
                summary: 'Get logged-in doctor appointments',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Doctor appointments' }
                }
            }
        },
        '/api/medical-records': {
            post: {
                tags: ['Medical Records'],
                summary: 'Create medical record (doctor only)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/GenericObject' }
                        }
                    }
                },
                responses: {
                    201: { description: 'Medical record created' }
                }
            }
        },
        '/api/medical-records/appointment/{appointmentId}': {
            get: {
                tags: ['Medical Records'],
                summary: 'Get record by appointment id',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'appointmentId', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Medical record' }
                }
            }
        },
        '/api/medical-records/my': {
            get: {
                tags: ['Medical Records'],
                summary: 'Get logged-in patient records',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Patient records' }
                }
            }
        },
        '/api/medical-records/patient/{patientId}': {
            get: {
                tags: ['Medical Records'],
                summary: 'Get records by patient id (doctor only)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'patientId', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Patient records' }
                }
            }
        },
        '/api/records/patient': {
            get: {
                tags: ['Records'],
                summary: 'Patient fetch own records',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Patient records' }
                }
            }
        },
        '/api/records/{patientId}': {
            get: {
                tags: ['Records'],
                summary: 'Doctor fetch specific patient records',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'patientId', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Patient records' }
                }
            }
        },
        '/api/medicines': {
            get: {
                tags: ['Medicines'],
                summary: 'Get medicines',
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: 'Medicine list' }
                }
            },
            post: {
                tags: ['Medicines'],
                summary: 'Create medicine (pharmacist only)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/GenericObject' }
                        }
                    }
                },
                responses: {
                    201: { description: 'Medicine created' }
                }
            }
        },
        '/api/medicines/{id}': {
            put: {
                tags: ['Medicines'],
                summary: 'Update medicine (pharmacist only)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/GenericObject' }
                        }
                    }
                },
                responses: {
                    200: { description: 'Medicine updated' }
                }
            },
            delete: {
                tags: ['Medicines'],
                summary: 'Delete medicine (pharmacist only)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: {
                    200: { description: 'Medicine deleted' }
                }
            }
        }
    }
};

const registerSwaggerDocs = (app) => {
    const swaggerSetup = swaggerUi.setup(openApiSpec, { explorer: true });

    app.use('/api/docs', swaggerUi.serve);
    app.get('/api/docs', swaggerSetup);
    app.get('/api/docs/', swaggerSetup);

    app.get('/api/openapi.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(openApiSpec);
    });
};

module.exports = {
    openApiSpec,
    registerSwaggerDocs
};
