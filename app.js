const express = require('express');
const util = require('util');
const superagent = require('superagent');
const superagentPrefix = require('superagent-prefix');
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.use(express.json({limit: '50mb'}));

const server = app.listen(port, () => {
  console.log(`Getlabs sample application listening at http://localhost:${port}`)
});

// config provided by getlabs
const getlabsConifg = {
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
  lastName: 'Patient'
}

// check getlabsConifg is setup
if (!getlabsConifg.apiToken) {
  throw new Error('Missing API Token. Add your Getlabs API token to getlabsConifg.');
} else if (!getlabsConifg.clientId) {
  throw new Error('Missing clientId. Add your Getlabs client id.');
} else if (!loggedInUser.email || !loggedInUser.phoneNumber) {
  throw new Error('Missing user email address or phone number. Add the missing data to loggedInUser.');
}

/**
 * this houses the oauth token response from getlabs api
 * @type {{}}
 */
let oauthTokenResp = {
  access_token: '',
  refresh_token: ''
}

/**
 * returns the http client used to make external requests
 * @param bearerToken: the Authorization bearer token value for said request
 */
const getHttpClient = (bearerToken) => superagent
  .agent()
  .use(superagentPrefix(`https://${getlabsConifg.hostname}`))
  .set('accept', 'json')
  .set('Authorization', `Bearer ${bearerToken}`);

/**
 * this generates a signed jwt in order for us to receive an oauth access_token from getlabs
 * NOTE: we sign the jwt with the apiToken as your secret
 */
const generateJwtForOauthToken = () => {
  const jwt = require('jsonwebtoken');

  // build header
  const jwtHeader = {
    algorithm: 'HS512',
  };

  // build payload
  const jwtPayload = {
    sub: getlabsConifg.clientId,
    aud: `https://${getlabsConifg.hostname}/oauth/token`,
  };

  return jwt.sign(jwtPayload, getlabsConifg.apiToken, jwtHeader);
};

/**
 * this method fetches an access token from getlabs api in order to make requests
 * @type {Promise<unknown>}
 */
function setOauthTokenResp() {
  return getHttpClient(generateJwtForOauthToken())
    .post('/oauth/token')
    .then(async (response) => {
      console.log(`Token response received: storing token response`);
      oauthTokenResp = response.body;
    })
    .catch((error) => {
      console.error('Error fetching access token from Getlabs:', util.inspect(error.response?.body, false, null, true));
      server.close();
    });
};

/**
 * this method is used to update your access token in the event that it expires
 * @param refresh_token
 */
function refreshAccessToken(access_token, refresh_token) {
  return getHttpClient(access_token)
    .post(`/oauth/refresh_token`)
    .query({refresh_token: refresh_token})
    .then((response) => {
      console.log(`Refreshing tokens: success`);
      oauthTokenResp = response.body;
    })
    .catch(async (error) => {
      // if we get a 400 back then our refresh token is expired and we need to get a new one
      if (error.status == 400) {
        console.log('Refreshing tokens: failed')
        await setOauthTokenResp();
      } else {
        console.error('Error fetching access token from Getlabs:', util.inspect(error.response?.body, false, null, true));
      }
    });

}

/**
 * Function to Fetch or create the patient during startup based on the loggedInUser set above.
 * Stores the resulting promise so the the patient's ID can be added to requests.
 */
function getGetlabsPatient(access_token) {
  getHttpClient(access_token).post('/patient')
    .send(loggedInUser)
    .then((response) => {
      console.log(`Patient fetched from https://${getlabsConifg.hostname}/patient, all API requests will be made for this patient:`, response.body);
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
  const logRequest = (status) => console.log(`[Getlabs request] ${req.method} ${status} https://${getlabsConifg.hostname}${req.originalUrl}`);
  const glReq = getHttpClient(oauthTokenResp.access_token)[req.method.toLowerCase()](req.originalUrl);
  if (!['GET', 'DELETE'].includes(req.method)) {
    glReq.send(req.body);
  }
  glReq.then((response) => {
    logRequest(response.status);
    res.statusCode = response.status;
    res.send(response.body);
  })
    .catch(async (error) => {
      if (error.status == 401) {
        // refresh tokens
        await refreshAccessToken(oauthTokenResp.access_token, oauthTokenResp.refresh_token);

        //retry request with refreshed tokens
        getlabsApiProxy(req, res)
      } else {
        logRequest(error.status);
        res.statusCode = error.status;
        res.send(error.response.body);
      }
    });
}

/**
 * kick off the service
 */
setOauthTokenResp();

/**
 * setup service endpoints
 */

app.get('/availability', getlabsApiProxy);

app.post('/file', getlabsApiProxy);

app.post(['/payment/setup', '/appointment'], (req, res) => {
  // only allow requests by the logged in patient
  getGetlabsPatient(oauthTokenResp.access_token).then((patient) => {
    req.body.patientId = patient.id;
    getlabsApiProxy(req, res);
  });
});