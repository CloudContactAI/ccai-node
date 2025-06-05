# CCAI Node.js Client

A TypeScript client for the Cloud Contact AI API that allows you to easily send SMS messages.

## Requirements

- Node.js v18.0.0 or higher (optimized for Node.js v24.1.0)

## Installation

```bash
npm install
```

## Build

```bash
npm run build
```

## Usage

```typescript
import { CCAI } from 'ccai-node';

// Initialize the client
const ccai = new CCAI({
  clientId: 'YOUR-CLIENT-ID',
  apiKey: 'API-KEY-TOKEN'
});

// Send an SMS to multiple recipients
const accounts = [
  {
    firstName: "John",
    lastName: "Doe",
    phone: "+15551234567"
  }
];

ccai.sms.send(
  accounts,
  "Hello ${firstName} ${lastName}, this is a test message!",
  "Test Campaign"
)
  .then(response => console.log('Success:', response))
  .catch(error => console.error('Error:', error));

// Send an SMS to a single recipient
ccai.sms.sendSingle(
  "Jane",
  "Smith",
  "+15559876543",
  "Hi ${firstName}, thanks for your interest!",
  "Single Message Test"
)
  .then(response => console.log('Success:', response))
  .catch(error => console.error('Error:', error));
```

### Using Async/Await

```typescript
async function sendMessages() {
  try {
    // Send to multiple recipients
    const response = await ccai.sms.send(
      accounts,
      "Hello ${firstName} ${lastName}!",
      "Test Campaign"
    );
    console.log('Success:', response);
    
    // Send with progress tracking
    const options = {
      onProgress: (status) => console.log(`Status: ${status}`)
    };
    
    await ccai.sms.sendSingle(
      "Jane",
      "Smith",
      "+15559876543",
      "Hi ${firstName}!",
      "Test Campaign",
      options
    );
  } catch (error) {
    console.error('Error:', error);
  }
}
```

## Project Structure

- `src/` - Source code
  - `ccai.ts` - Main CCAI client class
  - `sms/` - SMS-related functionality
    - `sms.ts` - SMS service class
  - `index.ts` - Main exports
  - `examples/` - Example usage
  - `__tests__/` - Test files
- `dist/` - Compiled JavaScript (generated after build)
- `.github/` - GitHub workflows and configurations
  - `workflows/` - CI/CD workflows
  - `renovate.json` - Dependency update configuration

## Development

### Prerequisites

- Node.js v18.0.0 or higher (v24.1.0 recommended)
- npm or yarn

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`

### Node Version Management

This project includes an `.nvmrc` file specifying Node.js v24.1.0. If you use nvm, you can run:

```bash
nvm use
```

to automatically switch to the correct Node.js version.

### Testing

Run tests with Jest:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

### Linting and Formatting

This project uses Biome for linting and formatting:

```bash
# Check for linting issues
npm run lint

# Fix linting issues
npm run lint:fix

# Check formatting
npm run format

# Fix formatting issues
npm run format:fix
```

### Continuous Integration

This project uses GitHub Actions for CI/CD:

- Runs tests on Node.js 18, 20, and 24
- Checks code formatting and linting
- Generates and uploads test coverage reports

### Dependency Management

This project uses Renovate for automated dependency updates:

- Automatically creates PRs for dependency updates
- Configures automerge for minor and patch updates
- Groups related dependency updates together
- Runs on a weekly schedule (weekends)

### Git Ignored Files

This project includes a `.gitignore` file that excludes:
- `node_modules/` - Dependencies
- `dist/` - Compiled output
- `coverage/` - Test coverage reports
- IDE files (`.vscode/`, `.idea/`, etc.)
- Log files
- Environment variables (`.env`)
- Temporary files

## Features

- TypeScript support with full type definitions
- Promise-based API with async/await support
- Support for sending to multiple recipients
- Support for template variables (firstName, lastName)
- Progress tracking via callbacks
- Comprehensive error handling
- Unit tests with Jest
- Code quality tools with Biome
- Automated dependency updates with Renovate
- CI/CD with GitHub Actions
- Modern Node.js support (v18+, optimized for v24.1.0)

## License

MIT © 2025 CloudContactAI LLC
