/**
 * Example: Cluster Aggregation
 * 
 * This example demonstrates how to use the cluster aggregation feature
 * to analyze data from groups of devices.
 */

import DataAccess from '../index.js';

/**
 * Main function to demonstrate cluster aggregation
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

    // 1. First, let's get all available load entities (clusters)
    console.log('Fetching load entities...');
    const loadEntities = await dataAccess.getLoadEntities();
    
    console.log(`Found ${loadEntities.length} load entities`);
    
    if (loadEntities.length === 0) {
      console.log('No load entities found. Please create some clusters first.');
      return;
    }
    
    // Display the first few load entities
    console.log('\nAvailable load entities:');
    loadEntities.slice(0, 3).forEach((entity, index) => {
      console.log(`\nEntity ${index + 1}:`);
      console.log(`  ID: ${entity._id}`);
      console.log(`  Name: ${entity.name}`);
      console.log(`  Type: ${entity.type}`);
      
      if (entity.clusters && entity.clusters.length > 0) {
        console.log(`  Clusters: ${entity.clusters.length}`);
        console.log(`  First cluster ID: ${entity.clusters[0].clusterId}`);
        console.log(`  First cluster name: ${entity.clusters[0].name}`);
      }
    });
    
    // 2. Let's select the first cluster for aggregation
    let selectedCluster = null;
    let clusterType = null;
    
    // Find a valid cluster for the example
    for (const entity of loadEntities) {
      if (entity.clusters && entity.clusters.length > 0) {
        selectedCluster = entity.clusters[0].clusterId;
        clusterType = entity.type;
        break;
      }
    }
    
    if (!selectedCluster) {
      console.log('No valid clusters found for aggregation.');
      return;
    }
    
    console.log(`\nSelected cluster ID: ${selectedCluster}`);
    console.log(`Cluster type: ${clusterType}`);
    
    // 3. Now, let's perform cluster aggregation
    console.log('\nPerforming cluster aggregation...');
    
    // Set time range for the last 24 hours
    const endTime = new Date();
    const startTime = new Date(endTime);
    startTime.setHours(startTime.getHours() - 24);
    
    // Format dates for API
    const formattedStartTime = startTime.toISOString();
    const formattedEndTime = endTime.toISOString();
    
    console.log(`Time range: ${formattedStartTime} to ${formattedEndTime}`);
    
    // Perform aggregation with sum and average operators
    const aggregationResult = await dataAccess.clusterAggregation({
      clusterId: selectedCluster,
      clusterType: clusterType,
      operator1: 'sum', // First aggregation operation
      operator2: 'avg', // Second aggregation operation
      startTime: formattedStartTime,
      endTime: formattedEndTime,
      unix: false // Return timestamps in ISO format
    });
    
    // 4. Display the aggregation results
    console.log('\nAggregation Results:');
    
    if (aggregationResult && aggregationResult.data) {
      console.log(`\nData points: ${aggregationResult.data.length}`);
      
      if (aggregationResult.data.length > 0) {
        console.log('\nFirst few data points:');
        aggregationResult.data.slice(0, 3).forEach((point, index) => {
          console.log(`\nPoint ${index + 1}:`);
          console.log(`  Time: ${point.time}`);
          
          // Display values for each sensor
          Object.entries(point).forEach(([key, value]) => {
            if (key !== 'time' && key !== '_id') {
              console.log(`  ${key}: ${value}`);
            }
          });
        });
        
        // 5. Calculate some basic statistics
        console.log('\nBasic Statistics:');
        
        // Get sensor names (excluding time and _id fields)
        const sensorNames = Object.keys(aggregationResult.data[0]).filter(
          key => key !== 'time' && key !== '_id'
        );
        
        // Calculate min, max, and average for each sensor
        sensorNames.forEach(sensor => {
          const values = aggregationResult.data
            .map(point => point[sensor])
            .filter(value => value !== null && value !== undefined);
          
          if (values.length > 0) {
            const min = Math.min(...values);
            const max = Math.max(...values);
            const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
            
            console.log(`\nSensor: ${sensor}`);
            console.log(`  Min: ${min.toFixed(2)}`);
            console.log(`  Max: ${max.toFixed(2)}`);
            console.log(`  Avg: ${avg.toFixed(2)}`);
          }
        });
      } else {
        console.log('No data points available in the specified time range.');
      }
    } else {
      console.log('No aggregation results returned.');
    }
    
  } catch (error) {
    console.error('Error in example:', error.message);
  }
}

// Run the example
main().catch(console.error); 