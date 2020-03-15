//Usage: ask gym counter how busy the gym is

const Alexa = require('ask-sdk-core');
const axios = require('axios');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

/**
 * Data used to drive the api requests
 * @type {{pin: *, loginUrl: string, email: *, associateAccount: string}}
 */
const DATA = {
  associateAccount: 'false',
  email: process.env.GYM_EMAIL,
  pin: process.env.GYM_PIN,
  loginUrl: 'https://www.puregym.com/Login/?ReturnUrl=%2Fmembers%2F'
}

const getNumberOfPeople = async () => {
  const startDate = new Date();
  const getResponse = await axios({
    method: 'get',
    url: DATA.loginUrl
  })

  const loginHeaders = getResponse.headers['set-cookie'].map(header => header.split(';')[0] + ';')
  const dom = new JSDOM(getResponse.data);
  const requestVerificationFromCookie = loginHeaders[5]
  const requestFromBody = dom.window.document.getElementsByName('__RequestVerificationToken')[0].value
  //This is hardcoded but should be a way to get this from response
  const rayGunCookieValue = 'raygun4js-userid=f8df9586-a6c4-f3f3-adfa-17e796b9c49d;'
  const initialCookie = `${loginHeaders[0]} ${loginHeaders[3]} ${requestVerificationFromCookie} CookieNotification=; ${rayGunCookieValue} ${loginHeaders[1]} ${loginHeaders[2].split(';')[0]}`

  const apiLoginResponse = await axios({
    method: 'post',
    url: 'https://www.puregym.com/api/members/login/',
    data: DATA,
    headers: {
      authority: 'www.puregym.com',
      accept: 'application/json, text/javascript',
      origin: 'https://www.puregym.com',
      'x-requested-with': 'XMLHttpRequest',
      '__requestverificationtoken': requestFromBody,
      'content-type': 'application/json',
      'sec-fetch-sit': 'same-origin',
      'sec-fetch-mode': 'cors',
      referer: 'https://www.puregym.com/Login/?ReturnUrl=%2Fmembers%2F',
      cookie: initialCookie
    }
  })

  const aspNetCookie = apiLoginResponse.headers['set-cookie'][1].split(';')[0]
  const newCookie = initialCookie + '; ' + aspNetCookie
  const axiosBody = {
    method: 'get',
    url: 'https://www.puregym.com/members/',
    data: DATA,
    headers: {
      authority: 'www.puregym.com',
      'upgrade-insecure-requests': '1',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
      'accept-encoding': 'gzip, deflate, br',
      'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
      cookie: newCookie,
      referer: 'https://www.puregym.com/login/',
      origin: 'https://www.puregym.com',
      'x-requested-with': 'XMLHttpRequest',
      'sec-fetch-sit': 'same-origin',
      'sec-fetch-mode': 'navigate',
      'sec-fetch-user': '71'
    }
  }

  const membersResponse = await axios(axiosBody)
  const membersDom = new JSDOM(membersResponse.data);
  const numberOfPeople = membersDom.window.document.getElementsByClassName('heading--level3').item(0).textContent
  const GET_GYM_NUMBER_MESSAGE_START = 'There\'s ';
  const GET_GYM_NUMBER_MESSAGE_ENDING = ' in the gym right now';
  const message = GET_GYM_NUMBER_MESSAGE_START + numberOfPeople + GET_GYM_NUMBER_MESSAGE_ENDING;

  const endDate = new Date();
  const difference = (endDate - startDate) / 1000;
  console.log(`Took ${difference} seconds to execute`)
  return message
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speakOutput = 'Welcome, you can ask how busy the gym is';
    return handlerInput.responseBuilder
    .speak(speakOutput)
    .reprompt(speakOutput)
    .getResponse();
  }
};

const HelloWorldIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GymIntent';
  },
  async handle(handlerInput) {
    const speakOutput = await getNumberOfPeople();
    return handlerInput.responseBuilder
    .speak(speakOutput)
    .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speakOutput = 'You can ask me how busy the gym is. How can I help?';

    return handlerInput.responseBuilder
    .speak(speakOutput)
    .reprompt(speakOutput)
    .getResponse();
  }
};
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speakOutput = 'Goodbye!';
    return handlerInput.responseBuilder
    .speak(speakOutput)
    .getResponse();
  }
};
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    // Any cleanup logic goes here.
    return handlerInput.responseBuilder.getResponse();
  }
};

const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
  },
  handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const speakOutput = `You just triggered ${intentName}`;

    return handlerInput.responseBuilder
    .speak(speakOutput)
    .getResponse();
  }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`~~~~ Error handled: ${error.stack}`);
    const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

    return handlerInput.responseBuilder
    .speak(speakOutput)
    .reprompt(speakOutput)
    .getResponse();
  }
};

// The SkillBuilder acts as the entry point for the skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
.addRequestHandlers(
  LaunchRequestHandler,
  HelloWorldIntentHandler,
  HelpIntentHandler,
  CancelAndStopIntentHandler,
  SessionEndedRequestHandler,
  IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers
)
.addErrorHandlers(
  ErrorHandler,
)
.lambda();
