// @ts-check
const { createServer } = require("http");
const express = require("express");
const { execute, subscribe } = require("graphql");
const { ApolloServer, gql } = require("apollo-server-express");
const { PubSub } = require("graphql-subscriptions");
const { SubscriptionServer } = require("subscriptions-transport-ws");
const { makeExecutableSchema } = require("@graphql-tools/schema");

(async () => {
  
const PORT = 4000;
const pubsub = new PubSub();
const app = express();
const httpServer = createServer(app);

// Schema definition
const typeDefs = gql`
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  type BlockInfo {
    number: Int
    avgBlockTime: Float
    hashRate: String
    difficulty: String
  }

  enum TimeseriesScale {
    days
    hours
    minutes
    seconds
  }

  type TimeseriesData {
    value: String
    timestamp: Int
  }

  type TimeseriesResponse {
    items: [TimeseriesData]
    nextKey: String
  }

  type BlockRewards {
    total: String
  }

  type BlockSummary {
    number: Int
    miner: String
    txCount: Int
    timestamp: Int
    rewards: BlockRewards
    txFail: Int
  }

  type Transfer {
    transactionHash: String
    to: String
    block: Int
    timestamp: Int
    from: String
    txFee: String
    status: Boolean
  }

  type EthTransfer {
    transfer: Transfer
    value: String
  }

  type ETHTransfers {
    transfers: [EthTransfer]
    nextKey: String
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    getLatestBlockInfo: BlockInfo
    getTimeseriesData(key: String, scale: TimeseriesScale, fromT: Int, toT: Int, nextKey: String): TimeseriesResponse
    getBlocksArrayByNumber(fromBlock: Int, limit: Int): [BlockSummary]
    getTimestamp: String
    getAllEthTransfers(limit: Int, nextKey: String): ETHTransfers
  }

  type Subscription {
    numberIncremented: Int
    newBlockFeed: BlockSummary
  }
`;

const latestBlockInfo = {
  number: 100,
  avgBlockTime: 3.6,
  hashRate: '1234000000000',
  difficulty: '123000000000',
};

  // Resolver map
const resolvers = {
  Query: {
    getLatestBlockInfo: () => latestBlockInfo,
    getTimestamp: () => {
      const timestamp = new Date().getTime()
      return String(timestamp)
    },
    getTimeseriesData: (parent, args) => {
      let timeseriesData = []
      const timestamp = new Date().getTime()
      let value = '123'
      if (args.key == 'GAS_PRICE_MIN') {
        value = '12300000000'
      }
      else if (args.key == 'GAS_PRICE_MAX') {
        value = '523000000000'
      }
      else if (args.key == 'GAS_PRICE_AVG') {
        value = '22300000000'
      }
      else if (args.key == 'TX_COUNT_TOTAL') {
        value = '523'
      }
      else if (args.key == 'PENDING_TX_COUNT_TOTAL') {
        value = '2230'
      }
      for(let i=0; i<10; i++) {
        timeseriesData.push({value: value, timestamp: Math.floor(timestamp/1000)-i*60})
      }
      return {items: timeseriesData, nextKey: '123'}
    },
    getBlocksArrayByNumber: (parent, args) => {
      let blockSummarys = []
      const timestamp = new Date().getTime()
      for(let i=0; i<args.limit; i++) {
        const blockSummary = {
          number: args.fromBlock? args.fromBlock + i: 100 + i,
          miner: '0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8',
          txCount: 39,
          timestamp: Math.floor(timestamp/1000) - i*60,
          rewards: {total: '1234000000000000000'},
          txFail: 2
        }
        blockSummarys.push(blockSummary)
      }
      return blockSummarys
    },
    getAllEthTransfers: (parent, args) => {
      let ethTransfers = []
      const timestamp = new Date().getTime()
      for(let i=0; i<args.limit; i++) {
        const transfer = {
          transactionHash: '0x40c730e42e656b3c7f076bde0e5a4a4aa25b9e5a8a81b42a48bd05ab534871f9',
          to: '0x141b63a74da7503eb029491be0a74dd351a0d446',
          block: 100 + i,
          timestamp: Math.floor(timestamp/1000) - i*60,
          from: '0x6dfc34609a05bc22319fa4cce1d1e2929548c0d7',
          txFee: '1234000000000000',
          status: true
        }
        const ethTransfer = {
          transfer: transfer,
          value: '1230000000000000000'
        }
        ethTransfers.push(ethTransfer)
      }
      return {transfers: ethTransfers, nextKey: '12345'}
    },
  },
  Subscription: {
    numberIncremented: {
      subscribe: () => pubsub.asyncIterator(["NUMBER_INCREMENTED"]),
    },
    newBlockFeed: {
      subscribe: () => pubsub.asyncIterator(["NEW_BLOCK_FEED"]),
    },
  },
};

const schema = makeExecutableSchema({ typeDefs, resolvers });

const server = new ApolloServer({
  schema,
});
await server.start();
server.applyMiddleware({ app });

SubscriptionServer.create(
  { schema, execute, subscribe },
  { server: httpServer, path: server.graphqlPath }
);

httpServer.listen(PORT, () => {
  console.log(
    `🚀 Query endpoint ready at http://localhost:${PORT}${server.graphqlPath}`
  );
  console.log(
    `🚀 Subscription endpoint ready at ws://localhost:${PORT}${server.graphqlPath}`
  );
});

// In the background, increment a number every second and notify subscribers when
// it changes.
let currentNumber = 0;
function incrementNumber() {
  currentNumber++;
  pubsub.publish("NUMBER_INCREMENTED", { numberIncremented: currentNumber });
  const timestamp = new Date().getTime()
  const blockSummary = {
    number: currentNumber + 100,
    miner: '0xEA674fdDe714fd979de3EdF0F56AA9716B898ec8',
    txCount: 39,
    timestamp: Math.floor(timestamp/1000),
    rewards: {total: '1234000000000000000'},
    txFail: 2
  }
  pubsub.publish("NEW_BLOCK_FEED", { newBlockFeed: blockSummary });
  setTimeout(incrementNumber, 1000);
}
// Start incrementing
incrementNumber();

})();
