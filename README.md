# **Predictive Maintenance System**

# Table of Contents
- [**Predictive Maintenance System**](#predictive-maintenance-system)
- [Table of Contents](#table-of-contents)
  - [Introduction](#introduction)
  - [Tech Stack](#tech-stack)
  - [Setup Instructions](#setup-instructions)
    - [Prerequisites](#prerequisites)
    - [Cloning the Repository](#cloning-the-repository)
    - [Setting Up Docker](#setting-up-docker)
  - [Development](#development)
    - [Running the Development Server](#running-the-development-server)
  - [Testing](#testing)
  - [Production Build](#production-build)
  - [Usage](#usage)
  - [Contribution Guidelines](#contribution-guidelines)
  - [License](#license)

## Introduction
This project is a comprehensive IoT device simulation and monitoring system. It includes a Next.js dashboard for visualizing device data, Node-RED for workflow automation, and Mosquitto as the MQTT broker.

## Tech Stack
- **Frontend:** Next.js, React
- **Backend:** Node-RED
- **MQTT Broker:** Mosquitto
- **Containerization:** Docker
- **Languages:** TypeScript, JavaScript, Python

## Setup Instructions

### Prerequisites
- Git
- Docker
- Node.js (for local development)

### Cloning the Repository
```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
```

### Setting Up Docker
Ensure Docker is installed and running on your machine. Navigate to the project directory and build and start the Docker containers:
```bash
docker-compose up --build
```

## Development

### Running the Development Server
For the Next.js dashboard:
```bash
cd scheduler-dash
npm install
npm run dev
```

## Testing
To run tests for the Next.js dashboard:
```bash
cd scheduler-dash
npm run lint
```

## Production Build
To create a production build for the Next.js dashboard:
```bash
cd scheduler-dash
npm run build
npm start
```

## Usage
- Access the Next.js dashboard at [http://localhost:3000](http://localhost:3000).
- Access Node-RED at [http://localhost:1880](http://localhost:1880).
- The Mosquitto MQTT broker is available at `mqtt://localhost:1883`.

## Contribution Guidelines
1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Open a pull request.

## License
This project is licensed under the MIT License. See the LICENSE file for details.