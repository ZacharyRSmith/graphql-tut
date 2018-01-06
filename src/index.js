const { graphqlExpress, graphiqlExpress } = require('apollo-server-express');
const bodyParser = require('body-parser');
const express = require('express');
const { createServer } = require('http');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');

const { authenticate } = require('./authentication');
const buildDataloaders = require('./dataloaders');
const formatError = require('./formatError');
const connectMongo = require('./mongo-connector');
const schema = require('./schema');

const start = async () => {
  const mongo = await connectMongo();
  const app = express();
  const buildOptions = async (req, res) => {
    const user = await authenticate(req, mongo.Users);
    return {
      context: {
        dataloaders: buildDataloaders(mongo),
        mongo,
        user
      },
      formatError,
      schema
    };
  }
  const PORT = 3000;

  app.use('/graphql', bodyParser.json(), graphqlExpress(buildOptions));
  app.use('/graphiql', graphiqlExpress({
    endpointURL: '/graphql',
    passHeader: `'Authorization': 'bearer token-zacharysmith4989@gmail.com'`,
    subscriptionsEndpoint: `ws://localhost:${PORT}/subscriptions`
  }));
  const server = createServer(app);
  server.listen(PORT, () => {
    SubscriptionServer.create(
      { execute, subscribe, schema },
      { server, path: '/subscriptions' }
    );
    console.log(`Hackernews GraphQL server running on port ${PORT}.`);
  })
  // app.listen(PORT, (listenErr) => {
  //   console.log('listenErr', listenErr);
  //   console.log(`Hackernews GraphQL server running on port ${PORT}.`);
  // });
};

start();
