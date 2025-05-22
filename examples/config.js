/**
 * Configuration Example for IO Connect SDK
 * 
 * This example demonstrates how to create and use a configuration file
 * for the IO Connect SDK to make it more plug-and-play across different projects.
 */

/**
 * IO Connect SDK Configuration
 * 
 * You can modify these values to match your IoSense platform setup.
 * Create a copy of this file named 'config.local.js' for your specific environment
 * and add it to .gitignore to keep sensitive information out of version control.
 */
export const config = {
  // Required parameters
  userId: 'YOUR_USER_ID', // Replace with your user ID
  dataUrl: 'datads.iosense.io', // Your data service URL
  dsUrl: 'ds-server.iosense.io', // Your DS server URL
  
  // Optional parameters with defaults
  onPrem: false, // Set to true for on-premise installations
  tz: 'UTC', // Timezone (UTC or Asia/Kolkata)
  logTime: true, // Enable request time logging
  
  // Common devices and sensors for quick access
  devices: {
    device1: {
      id: 'DEVICE_ID_1',
      name: 'First Device',
      sensors: ['SENSOR_1', 'SENSOR_2']
    },
    device2: {
      id: 'DEVICE_ID_2',
      name: 'Second Device',
      sensors: ['SENSOR_3', 'SENSOR_4']
    }
  }
};

/**
 * Example usage of the configuration file
 */
import DataAccess from '../index.js';

/**
 * Creates a DataAccess instance using the configuration
 */
export function createDataAccess(customConfig = {}) {
  // Merge default config with any custom overrides
  const mergedConfig = {
    ...config,
    ...customConfig
  };
  
  return new DataAccess({
    userId: mergedConfig.userId,
    dataUrl: mergedConfig.dataUrl,
    dsUrl: mergedConfig.dsUrl,
    onPrem: mergedConfig.onPrem,
    tz: mergedConfig.tz,
    logTime: mergedConfig.logTime,
    logger: console
  });
}

// Example usage
if (require.main === module) {
  (async () => {
    try {
      // Create a DataAccess instance using the config
      const dataAccess = createDataAccess();
      
      // Get user information
      const userInfo = await dataAccess.getUserInfo();
      console.log('User Information:');
      console.log(JSON.stringify(userInfo, null, 2));
      
      // Use a preconfigured device
      if (config.devices.device1) {
        const deviceId = config.devices.device1.id;
        const sensorList = config.devices.device1.sensors;
        
        console.log(`\nQuerying data for preconfigured device: ${deviceId}`);
        console.log(`Sensors: ${sensorList.join(', ')}`);
        
        // Get latest data points
        const latestData = await dataAccess.getFirstDp({
          deviceId,
          sensorList,
          n: 1
        });
        
        console.log('\nLatest data point:');
        console.log(JSON.stringify(latestData, null, 2));
      }
    } catch (error) {
      console.error('Error in example:', error.message);
    }
  })();
} 