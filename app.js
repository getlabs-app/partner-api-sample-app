const express = require('express');
const util = require('util');
const Auth = require('./auth');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json({ limit: '50mb' }));
const server = app.listen(port, () => {
  console.log(`Getlabs sample application listening at http://localhost:${port}`);
});

// config provided by getlabs
const getlabsConfig = {
  hostname: 'sandbox.api.getlabs.com',
  apiToken: '', // this is your api token provided by getlabs
  clientId: '', // this is your getlabs provided client id
}

// Simulates a logged in user. All API requests will be made for this patient.
const loggedInUser = {
  email: '', // email address will receive notifications
  dob: '1970-01-01',
  birthSex: 'female',
  phoneNumber: '', // ex: 4805551234, phone number will receive SMS notifications
  firstName: 'Test',
  lastName: 'Patient',
};

// check getlabsConfig is setup
if (!getlabsConfig.apiToken) {
  throw new Error('Missing API Token. Add your Getlabs API token to getlabsConfig.');
} else if (!getlabsConfig.clientId) {
  throw new Error('Missing clientId. Add your Getlabs client id.');
} else if (!loggedInUser.email || !loggedInUser.phoneNumber) {
  throw new Error('Missing user email address or phone number. Add the missing data to loggedInUser.');
}

/**
 * Authenticate to getlabs api and setup default patient
 */
let patientDetails;
const auth = new Auth(getlabsConfig);
auth
  .authenticate()
  .then(() => {
    getGetlabsPatient().then((patient) => {
      patientDetails = patient;
    });
  })
  .catch(() => {
    server.close();
  });

/**
 * Function to Fetch or create the patient during startup based on the loggedInUser set above.
 * Stores the resulting promise so the the patient's ID can be added to requests.
 */
function getGetlabsPatient() {
  return auth
    .getHttpClient()
    .post('/patient')
    .send(loggedInUser)
    .then((response) => {
      console.log(
        `Patient fetched from https://${getlabsConfig.hostname}/patient, all API requests will be made for this patient:`,
        response.body,
      );
      return response.body;
    })
    .catch((error) => {
      console.error('Error fetching patient from Getlabs:', util.inspect(error.response?.body, false, null, true));
    });
}

/**
 * Proxies the request to the Getlabs API and sends the response.
 */
const getlabsApiProxy = (req, res) => {
  const logRequest = (status) =>
    console.log(`[Getlabs request] ${req.method} ${status} https://${getlabsConfig.hostname}${req.originalUrl}`);
  const glReq = auth.getHttpClient()[req.method.toLowerCase()](req.originalUrl);
  if (!['GET', 'DELETE'].includes(req.method)) {
    glReq.send(req.body);
  }
  glReq
    .then((response) => {
      logRequest(response.status);
      res.statusCode = response.status;
      res.send(response.body);
    })
    .catch(async (error) => {
      if (error.status == 401) {
        // refresh tokens
        await auth.refreshAccessToken();

        //retry request with refreshed tokens
        getlabsApiProxy(req, res);
      } else {
        logRequest(error.status);
        res.statusCode = error.status;
        res.send(error.response.body);
      }
    });
};

/**
 * setup service endpoints
 */

app.get('/availability', getlabsApiProxy);

app.post('/file', getlabsApiProxy);

app.post(['/payment/setup', '/appointment'], (req, res) => {
  // only allow requests by the logged in patient
  req.body.patientId = patientDetails.id;
  getlabsApiProxy(req, res);
});
