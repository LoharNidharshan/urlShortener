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
  console.log("The longUrl:!!"+result.Item.longUrl)
  return {
    statusCode: 301,
    headers: {
      Location: result.Item.longUrl,
    },
  };
};
