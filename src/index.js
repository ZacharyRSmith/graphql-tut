const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const bodyParser = require('body-parser');
const express = require('express');

const { authenticate } = require('./authentication');
const connectMongo = require('./mongo-connector');
const schema = require('./schema');

const start = async () => {
  const mongo = await connectMongo();
  const app = express();
  const buildOptions = async (req, res) => {
    const user = await authenticate(req, mongo.Users);
    return {
      context: { mongo, user },
      schema
    };
  }
  app.use('/graphql', bodyParser.json(), graphqlExpress(buildOptions));
  app.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql',
    passHeader: `'Authorization': 'bearer token-zacharysmith4989@gmail.com'`
  }));
  const PORT = 3000;
  app.listen(PORT, (listenErr) => {
    console.log('listenErr', listenErr);
    console.log(`Hackernews GraphQL server running on port ${PORT}.`);
  });
};

start();
