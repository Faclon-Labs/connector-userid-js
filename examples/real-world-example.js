/**
 * Real-world Example: Temperature Monitoring Dashboard Data Provider
 * 
 * This example demonstrates how to use the IO Connect SDK to build a data provider
 * for a temperature monitoring dashboard application.
 */

import DataAccess from '../index.js';
import { format, subDays } from 'date-fns';

/**
 * TemperatureMonitor class that handles fetching and processing temperature data
 */
class TemperatureMonitor {
  /**
   * Create a new TemperatureMonitor
   * @param {Object} config - Configuration object
   */
  constructor(config) {
    this.dataAccess = new DataAccess({
      userId: config.userId,
      dataUrl: config.dataUrl,
      dsUrl: config.dsUrl,
      onPrem: config.onPrem || false,
      tz: config.tz || 'UTC',
      logTime: config.logTime || true,
      logger: config.logger || console
    });
    
    this.deviceId = config.deviceId;
    this.temperatureSensors = config.temperatureSensors || [];
    this.cache = {
      dailyAverage: null,
      dailyAverageCachedAt: null,
      currentTemperature: null,
      currentTemperatureCachedAt: null
    };
    this.cacheTTL = 5 * 60 * 1000; // 5 minutes
  }
  
  /**
   * Get the current temperature from all sensors
   * @returns {Promise<Object>} Current temperature data
   */
  async getCurrentTemperature() {
    // Check cache
    const now = Date.now();
    if (
      this.cache.currentTemperature && 
      this.cache.currentTemperatureCachedAt && 
      now - this.cache.currentTemperatureCachedAt < this.cacheTTL
    ) {
      return this.cache.currentTemperature;
    }
    
    try {
      // Get the latest data point for each temperature sensor
      const data = await this.dataAccess.getFirstDp({
        deviceId: this.deviceId,
        sensorList: this.temperatureSensors,
        n: 1
      });
      
      // Process the data
      const result = {
        timestamp: new Date().toISOString(),
        deviceId: this.deviceId,
        temperatures: {}
      };
      
      // Extract temperature values from each sensor
      for (const sensor of this.temperatureSensors) {
        if (data && data[sensor] && data[sensor].length > 0) {
          const latestReading = data[sensor][0];
          result.temperatures[sensor] = {
            value: latestReading.value,
            unit: '°C',
            timestamp: latestReading.time
          };
        } else {
          result.temperatures[sensor] = {
            value: null,
            unit: '°C',
            timestamp: null,
            error: 'No data available'
          };
        }
      }
      
      // Calculate average temperature across all sensors
      const validTemperatures = Object.values(result.temperatures)
        .filter(t => t.value !== null)
        .map(t => t.value);
        
      result.averageTemperature = validTemperatures.length > 0
        ? validTemperatures.reduce((sum, val) => sum + val, 0) / validTemperatures.length
        : null;
      
      // Update cache
      this.cache.currentTemperature = result;
      this.cache.currentTemperatureCachedAt = now;
      
      return result;
    } catch (error) {
      console.error('Error getting current temperature:', error.message);
      throw new Error(`Failed to fetch current temperature: ${error.message}`);
    }
  }
  
  /**
   * Get daily average temperatures for the past week
   * @returns {Promise<Object>} Daily average temperature data
   */
  async getDailyAverageTemperatures() {
    // Check cache
    const now = Date.now();
    if (
      this.cache.dailyAverage && 
      this.cache.dailyAverageCachedAt && 
      now - this.cache.dailyAverageCachedAt < this.cacheTTL
    ) {
      return this.cache.dailyAverage;
    }
    
    try {
      // Calculate time range for the past 7 days
      const endTime = new Date();
      const startTime = subDays(endTime, 7);
      
      // Format dates for API
      const formattedStartTime = format(startTime, "yyyy-MM-dd'T'HH:mm:ss'Z'");
      const formattedEndTime = format(endTime, "yyyy-MM-dd'T'HH:mm:ss'Z'");
      
      // Get filtered operation data with 'avg' operation
      const data = await this.dataAccess.getFilteredOperationData({
        deviceId: this.deviceId,
        sensorList: this.temperatureSensors,
        operation: 'avg',
        startTime: formattedStartTime,
        endTime: formattedEndTime
      });
      
      // Process the data
      const result = {
        deviceId: this.deviceId,
        period: {
          startTime: formattedStartTime,
          endTime: formattedEndTime
        },
        dailyAverages: []
      };
      
      // Extract and format the data
      if (data && data.length > 0) {
        for (const entry of data) {
          const day = entry.time ? format(new Date(entry.time), 'yyyy-MM-dd') : null;
          if (day) {
            const temperatures = {};
            
            for (const sensor of this.temperatureSensors) {
              temperatures[sensor] = entry[sensor] !== undefined ? entry[sensor] : null;
            }
            
            // Calculate overall average for the day
            const validTemperatures = Object.values(temperatures)
              .filter(t => t !== null)
              .map(t => t);
              
            const averageTemperature = validTemperatures.length > 0
              ? validTemperatures.reduce((sum, val) => sum + val, 0) / validTemperatures.length
              : null;
              
            result.dailyAverages.push({
              date: day,
              temperatures,
              averageTemperature
            });
          }
        }
      }
      
      // Update cache
      this.cache.dailyAverage = result;
      this.cache.dailyAverageCachedAt = now;
      
      return result;
    } catch (error) {
      console.error('Error getting daily average temperatures:', error.message);
      throw new Error(`Failed to fetch daily average temperatures: ${error.message}`);
    }
  }
  
  /**
   * Generate a simple temperature report
   * @returns {Promise<Object>} Temperature report
   */
  async generateTemperatureReport() {
    try {
      // Get current temperature and daily averages
      const [current, dailyAverages] = await Promise.all([
        this.getCurrentTemperature(),
        this.getDailyAverageTemperatures()
      ]);
      
      // Generate the report
      return {
        generatedAt: new Date().toISOString(),
        deviceId: this.deviceId,
        currentTemperature: current,
        dailyAverages: dailyAverages,
        
        // Add some simple analytics
        analytics: {
          currentVsWeeklyAverage: current.averageTemperature !== null && dailyAverages.dailyAverages.length > 0
            ? current.averageTemperature - (
                dailyAverages.dailyAverages.reduce((sum, day) => sum + (day.averageTemperature || 0), 0) / 
                dailyAverages.dailyAverages.length
              )
            : null
        }
      };
    } catch (error) {
      console.error('Error generating temperature report:', error.message);
      throw new Error(`Failed to generate temperature report: ${error.message}`);
    }
  }
}

/**
 * Example usage
 */
async function main() {
  try {
    // Create a temperature monitor instance
    const monitor = new TemperatureMonitor({
      userId: 'YOUR_USER_ID', // Replace with your user ID
      dataUrl: 'datads.iosense.io',
      dsUrl: 'ds-server.iosense.io',
      deviceId: 'YOUR_DEVICE_ID', // Replace with your device ID
      temperatureSensors: ['TEMP_SENSOR_1', 'TEMP_SENSOR_2'] // Replace with your temperature sensor IDs
    });
    
    // Generate a temperature report
    console.log('Generating temperature report...');
    const report = await monitor.generateTemperatureReport();
    
    // Display the report
    console.log('\nTemperature Report:');
    console.log('==================\n');
    console.log(`Generated at: ${report.generatedAt}`);
    console.log(`Device ID: ${report.deviceId}`);
    
    console.log('\nCurrent Temperature:');
    console.log(`Average: ${report.currentTemperature.averageTemperature !== null ? report.currentTemperature.averageTemperature.toFixed(2) + '°C' : 'N/A'}`);
    console.log('\nSensor readings:');
    for (const [sensor, data] of Object.entries(report.currentTemperature.temperatures)) {
      console.log(`  - ${sensor}: ${data.value !== null ? data.value.toFixed(2) + '°C' : 'N/A'}`);
    }
    
    console.log('\nDaily Averages (Past Week):');
    for (const day of report.dailyAverages.dailyAverages) {
      console.log(`  ${day.date}: ${day.averageTemperature !== null ? day.averageTemperature.toFixed(2) + '°C' : 'N/A'}`);
    }
    
    console.log('\nAnalytics:');
    console.log(`Current temperature vs. weekly average: ${report.analytics.currentVsWeeklyAverage !== null ? report.analytics.currentVsWeeklyAverage.toFixed(2) + '°C' : 'N/A'}`);
    
  } catch (error) {
    console.error('Error in example:', error.message);
  }
}

// Run the example
main().catch(console.error); 