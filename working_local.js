
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

getNumberOfPeople().then(res => {
  console.log(res)
})