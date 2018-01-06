const { makeExecutableSchema } = require('graphql-tools');

const resolvers = require('./resolvers');

const typeDefs = `
  input AUTH_PROVIDER_EMAIL {
    email: String!
    password: String!
  }

  input AuthProviderSignupData {
    email: AUTH_PROVIDER_EMAIL
  }

  type Link {
    id: ID!
    url: String!
    description: String!
    postedBy: User
  }

  type Mutation {
    createLink(url: String!, description: String!): Link

    createUser(name: String!, authProvider: AuthProviderSignupData!): User

    signinUser(email: AUTH_PROVIDER_EMAIL): SigninPayload!
  }

  type SigninPayload {
    token: String
    user: User
  }

  type User {
    id: ID!
    name: String!
    email: String
  }

  type Query {
    allLinks: [Link!]!
  }
`;

module.exports = makeExecutableSchema({ resolvers, typeDefs });
