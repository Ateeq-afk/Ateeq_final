// Test script to verify the booking system works with the new multi-article implementation

import http from 'http';

const BASE_URL = 'http://localhost:4000';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testBookingSystemAPI() {

  try {
    // Test 1: Health Check
    const healthResponse = await makeRequest('/');

    // Test 2: Environment check
    const envResponse = await makeRequest('/test');

    // Test 3: Test new booking schema validation
    
    const testBookingData = {
      lr_type: 'system',
      from_branch: 'test-branch-1',
      to_branch: 'test-branch-2',
      sender_id: 'test-sender-1',
      receiver_id: 'test-receiver-1',
      payment_type: 'Paid',
      articles: [
        {
          article_id: 'test-article-1',
          quantity: 10,
          actual_weight: 25.5,
          charged_weight: 26.0,
          declared_value: 1000,
          rate_per_unit: 50,
          rate_type: 'per_kg',
          loading_charge_per_unit: 5,
          unloading_charge_per_unit: 5,
          description: 'Test electronics'
        },
        {
          article_id: 'test-article-2',
          quantity: 5,
          actual_weight: 15.0,
          charged_weight: 15.0,
          declared_value: 500,
          rate_per_unit: 100,
          rate_type: 'per_quantity',
          loading_charge_per_unit: 10,
          unloading_charge_per_unit: 10,
          description: 'Test furniture'
        }
      ]
    };

    const bookingResponse = await makeRequest('/api/bookings', 'POST', testBookingData);
    if (bookingResponse.status >= 400) {
    } else {
    }

    // Test 4: Test OGPL endpoints
    const ogplResponse = await makeRequest('/api/loading/ogpls');
    if (ogplResponse.status >= 400) {
    }

    // Test 5: Test rate calculation logic
    
    // Per-kg calculation: 26.0 kg * ₹50 = ₹1300 freight + (10 * ₹5) loading + (10 * ₹5) unloading = ₹1400
    const perKgExpected = 26.0 * 50 + 10 * 5 + 10 * 5;
    
    // Per-quantity calculation: 5 * ₹100 = ₹500 freight + (5 * ₹10) loading + (5 * ₹10) unloading = ₹600  
    const perQtyExpected = 5 * 100 + 5 * 10 + 5 * 10;
    
    const totalExpected = perKgExpected + perQtyExpected;
    


  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testBookingSystemAPI();