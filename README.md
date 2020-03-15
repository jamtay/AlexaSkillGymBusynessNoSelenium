# Alexa skill for gym busyness version 2
This alexa skill uses api requests instead of selenium to query puregym and find out how many people are in the gym 

The hope is for improved performance and speed

## Environment variables required

For both running in aws and locally you must set the following environment variables
- GYM_EMAIL   // the email for your puregym account
- GYM_PIN   // the pin you use for puregym

## To trigger on Alexa 

Currently to trigger on my Alexa say "Open gym counter" Then say "count" or "how busy is the gym?"

This code is just for the aws lambda so any set of intentions could be set up to trigger this lambda

For more info see: https://developer.amazon.com/en-GB/alexa/alexa-skills-kit/learn?

## Local testing 

To test locally run `working_local.js` by running `node working_local.js`

## Updating on aws

Sadly because the skill is quite large it is not possible to use the online editor.  This must be zipped, pushed to an s3 bucket.  
Then the lambda can be pointed at that and unzip this and run it

