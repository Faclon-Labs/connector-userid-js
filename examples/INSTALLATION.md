# IO Connect SDK Installation Guide

This guide provides step-by-step instructions for installing and integrating the IO Connect SDK into your project.

## Prerequisites

- Node.js 14.0.0 or higher
- npm or yarn package manager
- Valid IoSense platform credentials (User ID)

## Installation Methods

### Method 1: Clone the Repository (Recommended for customization)

```bash
# Clone the repository
git clone https://github.com/yourusername/connector-userid-js.git

# Navigate to the project directory
cd connector-userid-js

# Install dependencies
npm install
```

### Method 2: Install as a Package (Coming soon)

```bash
# Install from npm
npm install io-connect
```

## Configuration

After installation, you need to configure the SDK with your IoSense platform credentials:

1. Create a configuration file based on the example:

```javascript
// config.js
export const config = {
  userId: 'YOUR_USER_ID', // Replace with your user ID
  dataUrl: 'datads.iosense.io', // Your data service URL
  dsUrl: 'ds-server.iosense.io', // Your DS server URL
  onPrem: false, // Set to true for on-premise installations
  tz: 'UTC', // Timezone (UTC or Asia/Kolkata)
  logTime: true // Enable request time logging
};
```

2. Use this configuration to initialize the SDK:

```javascript
import DataAccess from 'io_connect';
import { config } from './config.js';

const dataAccess = new DataAccess({
  userId: config.userId,
  dataUrl: config.dataUrl,
  dsUrl: config.dsUrl,
  onPrem: config.onPrem,
  tz: config.tz,
  logTime: config.logTime,
  logger: console
});
```

## Running Examples

The SDK comes with several examples to help you get started:

```bash
# Run the user info example
npm run example:user-info

# Run the device metadata example
npm run example:device-metadata

# Run the data query example
npm run example:data-query

# Run the cluster aggregation example
npm run example:cluster

# Run the real-world application example
npm run example:real-world
```

## Integration into Your Project

To integrate the SDK into your existing project:

1. Copy the `io_connect` directory to your project
2. Install the required dependencies:

```bash
npm install axios date-fns winston winston-daily-rotate-file
```

3. Import and use the SDK:

```javascript
import DataAccess from './io_connect/index.js';

const dataAccess = new DataAccess({
  userId: 'YOUR_USER_ID',
  dataUrl: 'datads.iosense.io',
  dsUrl: 'ds-server.iosense.io'
});

// Now you can use dataAccess to interact with the IoSense platform
const userInfo = await dataAccess.getUserInfo();
console.log(userInfo);
```

## Troubleshooting

If you encounter any issues:

1. Check your network connection
2. Verify your user ID and other credentials
3. Ensure you're using the correct data and DS URLs
4. Check the console for specific error messages

For more detailed information, refer to the [README.md](../README.md) file or see the [examples](./) 