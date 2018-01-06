const { makeExecutableSchema } = require('graphql-tools');

const resolvers = require('./resolvers');

const typeDefs = `
  enum _ModelMutationType {
    CREATED
    UPDATED
    DELETED
  }

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
    votes: [Vote!]!
  }

  input LinkSubscriptionFilter {
    mutation_in: [_ModelMutationType!]
  }

  type LinkSubscriptionPayload {
    mutation: _ModelMutationType!
    node: Link
  }

  type Mutation {
    createLink(url: String!, description: String!): Link

    createUser(name: String!, authProvider: AuthProviderSignupData!): User

    createVote(linkId: ID!): Vote

    signinUser(email: AUTH_PROVIDER_EMAIL): SigninPayload!
  }

  type SigninPayload {
    token: String
    user: User
  }

  type Subscription {
    Link(filter: LinkSubscriptionFilter): LinkSubscriptionPayload
  }

  type User {
    id: ID!
    name: String!
    email: String
    votes: [Vote!]!
  }

  type Vote {
    id: ID!
    user: User!
    link: Link!
  }

  type Query {
    allLinks: [Link!]!
  }
`;

module.exports = makeExecutableSchema({ resolvers, typeDefs });
