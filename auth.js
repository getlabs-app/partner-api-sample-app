const superagent = require('superagent');
const superagentPrefix = require('superagent-prefix');
const jwt = require('jsonwebtoken');
const util = require('util');

/**
 * Auth class is used authenticate and to make calls to getlabs api
 */
class Auth {
  constructor(getlabsConfig) {
    this.getlabsConfig = getlabsConfig;
    this.oauthTokenResp = {
      access_token: '',
      refresh_token: '',
    };
  }

  /**
   * returns populated auth tokens
   * @returns {*|{access_token: string, refresh_token: string}}
   */
  getAuthTokens() {
    return this.oauthTokenResp;
  }

  /**
   * returns base path (and version) for getlabs api
   * api documentation: https://api.getlabs.com/docs
   * @returns {string}
   */
  getApiBasePath() {
    return `https://${this.getlabsConfig.hostname}/v2`;
  }

  /**
   * returns the http client used to make external requests
   * @param bearerToken: the Authorization bearer token value for said request
   */
  getHttpClient(bearerToken) {
    const sa = superagent.agent().use(superagentPrefix(this.getApiBasePath())).set('accept', 'json');

    if (bearerToken === undefined && this.getAuthTokens().access_token) {
      sa.set('Authorization', `Bearer ${this.getAuthTokens().access_token}`);
    }

    return sa;
  }

  /**
   * generates a signed jwt specific to the partner
   * @returns {*}
   */
  generateJwtForOauthToken() {
    // build header
    const jwtHeader = {
      algorithm: 'HS512',
    };

    // build payload
    const jwtPayload = {
      sub: this.getlabsConfig.clientId,
      aud: `https://${this.getlabsConfig.hostname}/oauth/token`,
    };

    return jwt.sign(jwtPayload, this.getlabsConfig.apiToken, jwtHeader);
  }

  /**
   * kicks off the authentication flow w getlabs
   * @returns {Promise<unknown>}
   */
  authenticate() {
    return this.getHttpClient()
      .post('/oauth/token')
      .send({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: this.generateJwtForOauthToken(),
      })
      .then(async (response) => {
        console.log(`Token response received: storing token response`);
        this.oauthTokenResp = response.body;
      })
      .catch((error) => {
        console.log(error);
        console.error('Error fetching access token from Getlabs:', util.inspect(error.response?.body, false, null, true));
      });
  }

  /**
   * update your access token in the event that it expires
   * @param refresh_token
   */
  refreshAccessToken() {
    return this.getHttpClient(this.getAuthTokens().access_token)
      .post('/oauth/token')
      .send({
        grant_type: 'refresh_token',
        refresh_token: this.getAuthTokens().refresh_token,
      })
      .then((response) => {
        console.log(`Refreshing tokens: success`);
        this.oauthTokenResp = response.body;
      })
      .catch(async (error) => {
        // if we get a 400 back then our refresh token is expired and we need to get a new one
        if (error.status == 400) {
          console.log('Refreshing tokens: failed');
          await this.authenticate();
        } else {
          console.error('Error fetching access token from Getlabs:', util.inspect(error.response?.body, false, null, true));
        }
      });
  }
}

module.exports = Auth;
