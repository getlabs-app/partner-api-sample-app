const express = require('express');
const util = require('util');
const superagent = require('superagent');
const superagentPrefix = require('superagent-prefix');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json({limit: '50mb'}));

const server = app.listen(port, () => {
  console.log(`Getlabs sample application listening at http://localhost:${port}`)
});

const getlabsConifg = {
  hostname: 'sandbox.api.getlabs.com',
  apiToken: ''
}

if (!getlabsConifg.apiToken) {
  throw new Error('Missing API Token. Add your Getlabs API token to getlabsConifg.');
}

// Simulates a logged in user. All API requests will be made for this patient.
const loggedInUser = {
  email: '', // email address will receive notifications
  dob: '1970-01-01',
  birthSex: 'female',
  phoneNumber: '', // ex: 4805551234, phone number will receive SMS notifications
  firstName: 'Test',
  lastName: 'Patient'
}

if (!getlabsConifg.apiToken) {
  throw new Error('Missing API Token. Add your Getlabs API token to getlabsConifg.');
} else if (!loggedInUser.email || !loggedInUser.phoneNumber) {
  throw new Error('Missing user email address or phone number. Add the missing data to loggedInUser.');
}

const agent = superagent
  .agent()
  .use(superagentPrefix(`https://${getlabsConifg.hostname}`))
  .set('accept', 'json')
  .set('Authorization', `Bearer ${getlabsConifg.apiToken}`);

/**
 * Fetches or creates the patient during startup based on the loggedInUser set above.
 * Stores the resulting promise so the the patient's ID can be added to requests.
 */
const getlabsPatient = agent.post('/patient')
  .send(loggedInUser)
  .then((response) => {
    console.log(`Patient fetched from https://${getlabsConifg.hostname}/patient, all API requests will be made for this patient:`, response.body);
    return response.body;
  })
  .catch((error) => {
    console.error('Error fetching patient from Getlabs:', util.inspect(error.response?.body, false, null, true));
    server.close();
  });

/**
 * Proxies the request to the Getlabs API and sends the response.
 */
const getlabsApiProxy = (req, res) => {
  const logRequest = (status) => console.log(`[Getlabs request] ${req.method} ${status} https://${getlabsConifg.hostname}${req.originalUrl}`);
  const glReq = agent[req.method.toLowerCase()](req.originalUrl);
  if (!['GET', 'DELETE'].includes(req.method)) {
    glReq.send(req.body);
  }
  glReq.then((response) => {
    logRequest(response.status);
    res.statusCode = response.status;
    res.send(response.body);
  })
    .catch((error) => {
      logRequest(error.status);
      res.statusCode = error.status;
      res.send(error.response.body);
    });
}

app.get('/availability', getlabsApiProxy);

app.post('/file', getlabsApiProxy);

app.post(['/payment/setup', '/appointment'], (req, res) => {
  // only allow requests by the logged in patient
  getlabsPatient.then((patient) => {
    req.body.patientId = patient.id;
    getlabsApiProxy(req, res);
  });
});