//TORUN: ask gym counter how busy the gym is


// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');
const axios = require('axios');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const DATA = {
  associateAccount: 'false',
  email: process.env.GYM_EMAIL,
  pin: process.env.GYM_PIN
}

const getNumberOfPeople = async () => {
  console.log("HELLO DOES THIS GET LOGGED")
  const startDate = new Date();
  const getResponse = await axios({
    method: 'get',
    url: 'https://www.puregym.com/Login/?ReturnUrl=%2Fmembers%2F'
  })

  const loginHeaders = getResponse.headers['set-cookie'].map(header => header.split(';')[0] + ';')
  const dom = new JSDOM(getResponse.data);
  const requestVerificationFromCookie = loginHeaders[5]
  const requestFromBody = dom.window.document.getElementsByName('__RequestVerificationToken')[0].value
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
  console.log('LOGGING BEFORE AXIOS')
// IT IS TIMING OUT SO NEED TO DO PROGRESSIVE STUFF

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
// DOES NOT WORK BECAUSE: TypeError: Cannot read property 'getDirectiveServiceClient' of undefined
// const HelloWorldIntentHandler = {
//     canHandle(handlerInput) {
//         return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
//             && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GymIntent';
//     },
//   async handle(handlerInput) {
//     const speechText = 'Hello World!';

//     await callDirectiveService(handlerInput);

//     return new Promise((resolve, reject) => {
//       setTimeout(() => {
//         const response = handlerInput.responseBuilder
//                         .speak(speechText)
//                         .withSimpleCard('Hello World', speechText)
//                         .getResponse();
//         resolve(response)
//       }, 3000);
//     })
//   },
// };

// function callDirectiveService(handlerInput) {
//   // Call Alexa Directive Service.
//   const { requestEnvelope, serviceClientFactory, attributesManager } = handlerInput;

//   const directiveServiceClient = serviceClientFactory.getDirectiveServiceClient();

//   const requestId = requestEnvelope.request.requestId;

//   // build the progressive response directive
//   const directive = {
//     header: {
//       requestId,
//     },
//     directive: {
//       type: 'VoicePlayer.Speak',
//       speech: `this is a test speech`,
//     },
//   };

//   // send directive
//   return directiveServiceClient.enqueue(directive);
// }

//DOES NOT WORK AS IT TIMES OUT AFTER 8 SECONDS AND THIS THIRD REQUEST IS SLOW
const HelloWorldIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'GymIntent';
  },
  async handle(handlerInput) {
    const speakOutput = await getNumberOfPeople();
    return handlerInput.responseBuilder
    .speak(speakOutput)
    //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
    .getResponse();
  }
};
const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speakOutput = 'You can say hello to me! How can I help?';

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

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
  },
  handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const speakOutput = `You just triggered ${intentName}`;

    return handlerInput.responseBuilder
    .speak(speakOutput)
    //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
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

// The SkillBuilder acts as the entry point for your skill, routing all request and response
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
