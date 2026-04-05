// Quick API test for slot creation and booking
const http = require('http');

const request = (method, path, body, token) => {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : '';
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(
            { hostname: 'localhost', port: 5000, path, method, headers },
            (res) => {
                let chunks = '';
                res.on('data', (d) => (chunks += d));
                res.on('end', () => {
                    try {
                        resolve({ status: res.statusCode, data: JSON.parse(chunks) });
                    } catch {
                        resolve({ status: res.statusCode, data: chunks });
                    }
                });
            }
        );
        req.on('error', reject);
        if (data) req.write(data);
        req.end();
    });
};

(async () => {
    try {
        // 1. Get list of doctors
        console.log('=== 1. Get Doctors ===');
        const docs = await request('GET', '/api/doctors');
        console.log(`Status: ${docs.status}, Count: ${docs.data.count}`);
        const firstDoctor = docs.data.data?.[0];
        if (!firstDoctor) {
            console.log('No doctors found — cannot proceed.');
            return;
        }
        console.log(`First doctor: ${firstDoctor.name} (${firstDoctor._id})`);

        // 2. Login as that doctor (need email/password — try a known test)
        console.log('\n=== 2. Doctor Login ===');
        const loginRes = await request('POST', '/api/doctor/login', {
            email: firstDoctor.email,
            password: 'Doctor@123'
        });
        console.log(`Status: ${loginRes.status}`);
        const doctorToken = loginRes.data?.token;
        
        if (!doctorToken) {
            console.log('Doctor login failed (expected if password unknown). Skipping slot creation test.');
            console.log('Response:', JSON.stringify(loginRes.data));
        } else {
            // 3. Create slots
            console.log('\n=== 3. Create Slots ===');
            const slotRes = await request('POST', '/api/appointments/slots', {
                date: '2026-04-10',
                startTime: '09:00',
                endTime: '12:00',
                slotDuration: 30
            }, doctorToken);
            console.log(`Status: ${slotRes.status}`);
            console.log(`Message: ${slotRes.data.message}`);
            if (slotRes.data.data) {
                console.log(`Created: ${slotRes.data.data.createdCount}, Total: ${slotRes.data.data.totalRequested}`);
                console.log(`Slots:`, slotRes.data.data.slots?.map(s => `${s.startTime}-${s.endTime}`).join(', '));
            }
        }

        // 4. Test get available slots (public endpoint)
        console.log('\n=== 4. Get Available Slots ===');
        const slotsRes = await request('GET', `/api/appointments/slots/${firstDoctor._id}?date=2026-04-10`);
        console.log(`Status: ${slotsRes.status}, Count: ${slotsRes.data.count}`);
        if (slotsRes.data.data?.length > 0) {
            console.log('Slots:', slotsRes.data.data.map(s => `${s.startTime}-${s.endTime} (${s.status})`).join(', '));
        }

        // 5. Root health check
        console.log('\n=== 5. Health Check ===');
        const health = await request('GET', '/');
        console.log(`Status: ${health.status}, Body: ${health.data}`);

        console.log('\n✅ All API tests completed.');
    } catch (err) {
        console.error('Test error:', err.message);
    }
})();
