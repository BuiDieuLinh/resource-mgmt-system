# Resource Management Mobile App

This is the mobile app for the Resource Management System, built with React Native and Expo.

## Features

- **Authentication**: Login with JWT token storage
- **Dashboard**: Main navigation menu
- **Employees**: View employee list with search functionality
- **Attendances**: Check-in/check-out with GPS tracking (if implemented)
- **Leave Requests**: View existing requests and submit new ones

## Tech Stack

- React Native 0.76
- Expo SDK
- React Navigation
- React Native Paper (Material Design)
- Axios for API calls
- Expo SecureStore for secure token storage

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the backend server (from the root project):

   ```bash
   cd ../backend
   npm install
   npm run start:dev
   ```

3. Start the mobile app:

   ```bash
   npx expo start
   ```

4. Use Expo Go app on your phone to scan the QR code, or run on simulator/emulator.

## API Configuration

The app connects to `http://localhost:3000`. For physical devices or emulators, update the API_BASE_URL in `src/lib/api.ts` to your computer's IP address (e.g., `http://192.168.1.100:3000`).

## Screens

- **Login**: Authenticate user
- **Home**: Dashboard with menu options
- **Employees**: List all employees with search
- **Attendances**: Today's attendance and check-in/out buttons
- **Leave Requests**: List of leave requests and submit new ones

## Notes

- Ensure backend is running and accessible
- For GPS features in attendances, additional permissions may be needed
- The app uses the same API endpoints as the web version

## Troubleshooting

### Common Errors

1. **AsyncStorageError: Native module is null**
   - Fixed by using Expo SecureStore instead of AsyncStorage
   - SecureStore provides secure, reliable storage for tokens

2. **Type Error: expected dynamic type 'boolean', but had type 'string'**
   - Usually from API responses with string values instead of booleans
   - Check backend returns proper JSON types
   - Ensure API_BASE_URL is correct for your device/emulator

3. **Network Error**
   - Verify backend is running on port 3000
   - Update API_BASE_URL for your network setup

4. **Authentication Issues**
   - Tokens are now stored securely with SecureStore
   - Clear data: In Expo, shake device and select appropriate options

### Debugging

- Add `console.log` in API calls to inspect responses.
- Use Expo DevTools (press `d` in terminal) for debugging.
- Check backend logs for API errors.
