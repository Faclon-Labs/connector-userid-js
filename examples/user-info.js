/**
 * Example: Retrieving User Information
 * 
 * This example demonstrates how to retrieve user information using the IO Connect SDK.
 */

import DataAccess from '../index.js';

/**
 * Main function to demonstrate user info retrieval
 */
async function main() {
  try {
    // Initialize the DataAccess connector with your configuration
    const dataAccess = new DataAccess({
      userId: 'YOUR_USER_ID', // Replace with your user ID
      dataUrl: 'datads.iosense.io',
      dsUrl: 'ds-server.iosense.io',
      onPrem: false,
      tz: 'UTC',
      logTime: true,
      logger: console
    });

    // Get user information
    const userInfo = await dataAccess.getUserInfo();
    
    // Display the user information
    console.log('User Information:');
    console.log(JSON.stringify(userInfo, null, 2));
    
    // Access specific user properties
    if (userInfo && userInfo.email) {
      console.log(`\nUser Email: ${userInfo.email}`);
    }
    
    if (userInfo && userInfo.organisation) {
      console.log(`Organization: ${userInfo.organisation.orgName}`);
    }
    
    if (userInfo && userInfo.userDetail && userInfo.userDetail.personalDetails) {
      const name = userInfo.userDetail.personalDetails.name;
      console.log(`User Name: ${name.first} ${name.last}`);
    }
  } catch (error) {
    console.error('Error in example:', error.message);
  }
}

// Run the example
main().catch(console.error); 