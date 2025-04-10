const fetch = require('node-fetch');

exports.handler = async function(event, context) {
  const sign = event.queryStringParameters.sign || 'aries';

  const response = await fetch(`https://aztro.sameerkumar.website/?sign=${sign}&day=today`, {
    method: 'POST'
  });

  const data = await response.json();

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  };
};