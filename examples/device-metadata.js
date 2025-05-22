/**
 * Example: Retrieving Device Metadata
 * 
 * This example demonstrates how to retrieve device metadata using the IO Connect SDK.
 */

import DataAccess from '../index.js';

/**
 * Main function to demonstrate device metadata retrieval
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

    // Get all device details
    console.log('Fetching all device details...');
    const deviceDetails = await dataAccess.getDeviceDetails();
    
    // Display the number of devices
    console.log(`\nFound ${deviceDetails.length} devices`);
    
    // Display the first few devices
    if (deviceDetails.length > 0) {
      console.log('\nFirst 3 devices:');
      deviceDetails.slice(0, 3).forEach((device, index) => {
        console.log(`\nDevice ${index + 1}:`);
        console.log(`  ID: ${device.devID}`);
        console.log(`  Type: ${device.devTypeID}`);
      });
      
      // Choose the first device for detailed metadata
      const deviceId = deviceDetails[0].devID;
      console.log(`\nFetching detailed metadata for device: ${deviceId}`);
      
      // Get metadata for specific device
      const deviceMetadata = await dataAccess.getDeviceMetaData(deviceId);
      
      // Display device metadata
      console.log('\nDevice Metadata:');
      if (deviceMetadata.sensors) {
        console.log('\nSensors:');
        deviceMetadata.sensors.forEach(sensor => {
          console.log(`  - ${sensor.sensorId}: ${sensor.sensorName}`);
        });
      }
      
      if (deviceMetadata.location) {
        console.log('\nLocation:');
        console.log(`  Latitude: ${deviceMetadata.location.latitude}`);
        console.log(`  Longitude: ${deviceMetadata.location.longitude}`);
      }
      
      if (deviceMetadata.properties) {
        console.log('\nProperties:');
        deviceMetadata.properties.slice(0, 5).forEach(prop => {
          console.log(`  - ${prop.propertyName}: ${prop.propertyValue}`);
        });
        if (deviceMetadata.properties.length > 5) {
          console.log(`  ... and ${deviceMetadata.properties.length - 5} more properties`);
        }
      }
    } else {
      console.log('No devices found');
    }
  } catch (error) {
    console.error('Error in example:', error.message);
  }
}

// Run the example
main().catch(console.error); 