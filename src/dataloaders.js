const Dataloader = require('dataloader');

async function batchUsers(Users, keys) {
  return await Users.find({ _id: { $in: keys }}).toArray();
}

module.exports = ({ Users }) => ({
  userLoader: new Dataloader(
    keys => batchUsers(Users, keys),
    { cacheKeyFn: key => key.toString() }
  )
});
