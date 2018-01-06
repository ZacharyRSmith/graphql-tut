const { ObjectID } = require('mongodb');
const { URL } = require('url');

const pubsub = require('../pubsub');

class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.field = field;
  }
}

function assertValidLink({ url }) {
  try {
    new URL(url);
  } catch(e) {
    throw new ValidationError('Link validation error: invalid url: ' + e, 'url');
  }
}

function buildFilters({ OR = [], description_contains, url_contains }) {
  const filter = (description_contains || url_contains) ? {} : null;
  if (description_contains) {
    filter.description = { $regex: `.*${description_contains}.*` };
  }
  if (url_contains) {
    filter.url = { $regex: `.*${url_contains}.*` };
  }

  let filters = filter ? [filter] : [];
  console.log('filters', filters);
  for (let i = 0; i < OR.length; i++) {
    console.log('buildFilters(OR[i])', buildFilters(OR[i]));
    filters = filters.concat(buildFilters(OR[i]));
  }
  console.log('filters', filters);
  return filters;
}

module.exports = {
  Link: {
    id: root => root._id || root.id,

    postedBy: async ({ postedById }, data, { dataloaders: { userLoader }}) => {
      if (!postedById) return Promise.resolve();
      return await userLoader.load(postedById);
    },

    votes: async ({ _id }, data, { mongo: { Votes }}) => {
      return await Votes.find({ linkId: _id }).toArray();
    }
  },

  Mutation: {
    createLink: async (root, data, { mongo: { Links }, user }) => {
      assertValidLink(data);
      const newLink = Object.assign({ postedById: user && user._id }, data);
      const response = await Links.insert(newLink);
      newLink.id = response.insertedIds[0];

      pubsub.publish('Link', { Link: { mutation: 'CREATED', node: newLink }});
      return newLink;
    },

    createUser: async (root, data, { mongo: { Users }}) => {
      const newUser = {
        name: data.name,
        email: data.authProvider.email.email,
        password: data.authProvider.email.password
      };
      const response = await Users.insert(newUser);
      return Object.assign({ id: response.insertedIds[0] }, newUser);
    },

    createVote: async (root, data, { mongo: { Votes }, user }) => {
      const newVote = {
        userId: user && user._id,
        linkId: new ObjectID(data.linkId)
      };
      const response = await Votes.insert(newVote);
      return Object.assign({ id: response.insertedIds[0] }, newVote);
    },

    signinUser: async (root, data, { mongo: { Users }}) => {
      const user = await Users.findOne({ email: data.email.email });
      if (data.email.password !== user.password) return;
      return { token: `token-${user.email}`, user };
    }
  },

  Subscription: {
    Link: {
      subscribe: () => pubsub.asyncIterator('Link')
    }
  },

  User: {
    id: root => root._id || root.id,

    votes: async ({ _id }, data, { mongo: { Votes }}) => {
      return await Votes.find({ userId: _id }).toArray();
    }
  },

  Vote: {
    id: root => root._id || root.id,

    link: async ({ linkId }, data, { mongo: { Links }}) => {
      return await Links.findOne({ _id: linkId });
    },

    user: async ({ userId }, data, { dataloaders: { userLoader }}) => {
      if (!userId) return Promise.resolve();
      return await userLoader.load(userId);
    }
  },

  Query: {
    allLinks: async (root, { filter }, { mongo: { Links }}) => {
      console.log('filter', filter);
      const query = filter ? { $or: buildFilters(filter) } : {};
      return await Links.find(query).toArray();
    }
  }
};
