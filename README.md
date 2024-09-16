# URL Shortener Service
## Overview
This project is a serverless URL shortener service, built using AWS SAM (Serverless Application Model). The service allows users to create shortened URLs and retrieve the original URLs based on the shortened IDs. The application is powered by AWS Lambda, API Gateway, and DynamoDB.

## The service consists of two main functions:

Shorten URL: Generates a shortened URL and stores it in a DynamoDB table.
Retrieve URL: Retrieves the original URL based on the short ID and redirects the user.
## Features
### Create Shortened URLs: 
Users can send a POST request with a long URL, and the service returns a shortened URL.
### Retrieve Original URLs: 
When the shortened URL is accessed, the service retrieves the original long URL from DynamoDB and redirects the user.
### Serverless Architecture: 
Built with AWS Lambda and API Gateway for scalable, event-driven architecture.
### Data Persistence: 
Uses DynamoDB to store the mapping between the shortened IDs and the original URLs.
### Efficient: 
DynamoDB is used in PAY_PER_REQUEST mode for cost efficiency based on the application's usage.
## Architecture
### API Gateway: 
Handles the HTTP requests for shortening and retrieving URLs.
### Lambda Functions:
### UrlShortenerFunction: 
Shortens the provided URL and stores the mapping in DynamoDB.
### UrlRetrieverFunction: 
Retrieves the long URL based on the short ID and redirects the user.
### DynamoDB: 
Stores the mapping between shortId and longUrl.
### SAM Template: 
Defines the resources and infrastructure needed for the URL shortener, including Lambda functions, API Gateway routes, and DynamoDB.
## SAM Template Details
The SAM template (template.yaml) defines the following resources:

## UrlShortenerFunction:

A Lambda function that handles URL shortening.
Stores the shortened URL and its mapping in DynamoDB.
Exposed via an API Gateway POST request to /shorten.

## UrlRetrieverFunction:

A Lambda function that retrieves the original long URL based on a short ID.
Redirects the user to the original URL.
Exposed via an API Gateway GET request to /{shortId}.

## UrlShortenerTable (DynamoDB Table):

Stores the mapping between the short ID (shortId) and the original URL (longUrl).
The table uses the shortId as the primary key.

## SAM Template
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: >
  url-shortener

Globals:
  Function:
    Timeout: 3

Resources:
  UrlShortenerFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: app.shortenUrl
      Runtime: nodejs20.x
      MemorySize: 128
      Policies:
        - Statement:
            Effect: Allow
            Action:
              - dynamodb:PutItem
            Resource: !GetAtt UrlShortenerTable.Arn
      Environment:
        Variables:
          TABLE_NAME: !Ref UrlShortenerTable
      Events:
        ShortenUrl:
          Type: Api
          Properties:
            Path: /shorten
            Method: post

  UrlRetrieverFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: app.retrieveUrl
      Runtime: nodejs20.x
      MemorySize: 128
      Policies:
        - Statement:
            Effect: Allow
            Action:
              - dynamodb:GetItem
            Resource: !GetAtt UrlShortenerTable.Arn
      Environment:
        Variables:
          TABLE_NAME: !Ref UrlShortenerTable
      Events:
        RetrieveUrl:
          Type: Api
          Properties:
            Path: /{shortId}
            Method: get

  UrlShortenerTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: UrlShortener
      AttributeDefinitions:
        - AttributeName: shortId
          AttributeType: S
      KeySchema:
        - AttributeName: shortId
          KeyType: HASH
      BillingMode: PAY_PER_REQUEST

Outputs:
  ShortenUrlApi:
    Description: "API Gateway endpoint URL for Shorten Url function"
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/shorten"
  RetrieveUrlApi:
    Description: "API Gateway endpoint URL for Retrieve Url function"
    Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/{shortId}"
```
## Lambda Function Code
### Shorten URL (shortenUrl)
This function generates a shortened URL by creating a random shortId and storing it in DynamoDB along with the original long URL.

```javascript
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.TABLE_NAME;

exports.shortenUrl = async (event) => {
  const body = JSON.parse(event.body);
  const longUrl = body.url;
  const shortId = uuidv4().slice(0, 6);

  const params = {
    TableName: tableName,
    Item: {
      shortId: shortId,
      longUrl: longUrl,
    },
  };

  await dynamoDb.put(params).promise();

  return {
    statusCode: 200,
    body: JSON.stringify({ shortUrl: `https://${event.headers.Host}/${shortId}` }),
  };
};
```
## Retrieve URL (retrieveUrl)
This function retrieves the original URL from DynamoDB using the provided shortId and redirects the user.

```javascript
const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.TABLE_NAME;

exports.retrieveUrl = async (event) => {
  const shortId = event.pathParameters.shortId;

  const params = {
    TableName: tableName,
    Key: {
      shortId: shortId,
    },
  };

  const result = await dynamoDb.get(params).promise();

  if (!result.Item) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'URL not found' }),
    };
  }

  return {
    statusCode: 301,
    headers: {
      Location: result.Item.longUrl,
    },
  };
};
```
## API Endpoints
POST /shorten: Shortens a provided URL and returns a shortened URL.

## Example Request Body:
```json
{
  "url": "https://www.example.com"
}
```
## Example Response:
```json
{
  "shortUrl": "https://your-api-url/abcdef"
}
```
GET /{shortId}: Redirects to the original long URL based on the short ID.

## Example Response: 
A 301 redirect to the original URL.
## Setup & Deployment
### Prerequisites
AWS Account: You need an AWS account with sufficient privileges to create Lambda functions, API Gateway, and DynamoDB tables.
Node.js: Ensure Node.js is installed for local development.
AWS SAM CLI: Install the AWS SAM CLI to build and deploy the application.
## Steps to Deploy
### Build the application:

```bash
sam build
```
### Deploy the application:

```bash
sam deploy --guided
```
Follow the prompts to specify parameters like stack name, region, etc.

Access the endpoints: After the deployment is complete, the API Gateway endpoint URLs for shortening and retrieving URLs will be outputted.
