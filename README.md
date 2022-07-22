# Getlabs Partner API Sample Application

## Installation

1. Install the required packages:
   ```
   npm install
   ```
2. In `app.js` add your private Getlabs dev API token and client id for :
   ```javascript
   const getlabsConfig = {
    apiToken: 'eyJpZCI6IjExMmE3NzhlLTBhNTQtNGNmOS05MzkwLWUxYjdjNGWIrYlBXSWl6MnhpcVZlZ2NKL0o5dGM9In0=',
    clientId: '733ae0db-360d-46ec-89e7-645aa9fab2dd'
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

NOTE: The patient's email, date of birth and birth sex must match a patient or app.js will throw startup errors.

## Test credit cards

Stripe offers several credit cards for testing both successful and error responses: <https://stripe.com/docs/testing>

## JWT token generation

If you'd like to test the API via [Postman](https://www.postman.com/) or another 3rd-party tool, you can generate a signed JWT token for the `/oauth/token` endpoint by running the included [jwt-token.html](jwt-token.html) utility in your browser.