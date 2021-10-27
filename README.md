# Getlabs Partner API Sample Application

## Installation

1. Install the required packages:
   ```
   npm install
   ```
2. In `app.js` add your private Getlabs dev API token:
   ```javascript
   const getlabsConifg = {
    apiToken: 'eyJpZCI6IjExMmE3NzhlLTBhNTQtNGNmOS05MzkwLWUxYjdjNGWIrYlBXSWl6MnhpcVZlZ2NKL0o5dGM9In0=',
    ...
   }
   ```
3. Start the application on the default port 3000:
   ```
   node app.js
   ```
   To start the application on a different port set the `PORT` environment variable:
   ```
   PORT=3001 node app.js
   ```

## Changing the patient

The application works with a single hardcoded user to simulate a user logged into your platform.
The user details can be modified in `app.js`:
```javascript
const loggedInUser = {
  "email": "test@getlabs.io",
  "dob": "1970-01-01",
  "birthSex": "female",
  "phoneNumber": "6022370549",
  "firstName": "Test",
  "lastName": "Patient"
}
```

## Test credit cards

Stripe offers several credit cards for testing both successful and error responses: <https://stripe.com/docs/testing>