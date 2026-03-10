// Test Predict Leads API
const AUTH_TOKEN = 'zE7etFBaW3gTkDovV_Ub';
const BASE_URL = 'https://api.predictleads.com/v3';

async function testEndpoint(endpoint, description) {
  console.log(`\n=== ${description} ===`);
  console.log(`GET ${endpoint}`);
  
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/vnd.api+json',
        'X-User-Token': AUTH_TOKEN,
      },
    });
    
    console.log(`Status: ${response.status}`);
    
    if (!response.ok) {
      const error = await response.text();
      console.log(`Error: ${error}`);
      return null;
    }
    
    const data = await response.json();
    console.log('Response structure:', Object.keys(data));
    
    if (data.data) {
      console.log(`Data count: ${data.data.length}`);
      if (data.data.length > 0) {
        console.log('First item keys:', Object.keys(data.data[0]));
        console.log('First item attributes:', Object.keys(data.data[0].attributes || {}));
      }
    }
    
    if (data.meta) {
      console.log('Meta:', data.meta);
    }
    
    return data;
  } catch (error) {
    console.log(`Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  // Test 1: Get a company
  const company = await testEndpoint('/companies/stripe.com', 'Get Company (stripe.com)');
  
  // Test 2: Get similar companies
  await testEndpoint('/companies/stripe.com/similar_companies?page=1&per_page=10', 'Similar Companies');
  
  // Test 3: Get job openings
  await testEndpoint('/companies/stripe.com/job_openings?page=1&per_page=10', 'Job Openings');
  
  // Test 4: Get technology detections
  await testEndpoint('/companies/stripe.com/technology_detections?page=1&per_page=10', 'Technology Detections');
  
  // Test 5: Get news events
  await testEndpoint('/companies/stripe.com/news_events?page=1&per_page=10', 'News Events');
  
  // Test 6: Get technologies list
  await testEndpoint('/technologies?page=1&per_page=10', 'Technologies List');
}

runTests();
