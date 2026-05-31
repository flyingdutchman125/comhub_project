const http = require('http');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const db = require('./config/db');

setTimeout(async () => {
  try {
    // Get a user from DB
    const [users] = await db.query('SELECT id, nama, global_role FROM users LIMIT 1');
    if (users.length === 0) { console.log('No users found!'); db.end(); return; }
    
    const testUser = users[0];
    console.log('Test user:', testUser.id, testUser.nama, testUser.global_role);
    
    // Create a fresh valid token
    const token = jwt.sign(
      { id: testUser.id, role: testUser.global_role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('Token created:', token.substring(0, 30) + '...');
    
    // Get a community ID
    const [communities] = await db.query('SELECT id FROM communities LIMIT 1');
    if (communities.length === 0) { console.log('No communities!'); db.end(); return; }
    const communityId = communities[0].id;
    console.log('Testing community ID:', communityId);
    
    // Test the endpoint
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/communities/${communityId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('\n=== API RESPONSE ===');
        console.log('Status:', res.statusCode);
        if (res.statusCode === 200) {
          const parsed = JSON.parse(data);
          console.log('OK! Community name:', parsed.name);
          console.log('Members count:', parsed.memberCount);
          console.log('avgRating:', parsed.avgRating);
        } else {
          console.log('ERROR Response:', data);
        }
        db.end();
      });
    });
    req.on('error', (e) => {
      console.error('Request error:', e.message);
      db.end();
    });
    req.end();
    
  } catch (e) {
    console.error('FATAL:', e.message, e.stack);
    db.end();
  }
}, 2000);
