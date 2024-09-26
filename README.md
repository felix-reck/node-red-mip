# Node-RED Module for MPDV Hydra System REST API

## Overview

This Node-RED module allows integration with the REST API of the Hydra System from MPDV. With this module, you can send and receive data to and from the Hydra System, enhancing your IoT solutions.

## Usage

### Node Configuration

After installation, you will find the new node in the Node-RED palette. Drag it into your flow and configure the following settings:

- **URL**: The URL of the REST API you want to access.
- **Username**: Your username for authentication.
- **Password**: Your password for authentication.
- **Type**: The specific Type of data or meta. 
- **Service**: The specific service you want to use.
- **Method**: Choose between `GET` and `POST`.
- **AccessId**: The Access ID if required.
- **SSL Verification**: Enable or disable SSL verification (default: Enabled).

### Example

