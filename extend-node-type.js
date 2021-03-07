"use strict";

const {
  getImageSizeAsync
} = require("gatsby-plugin-sharp");

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt
} = require("gatsby/graphql");

const {
  default: PQueue
} = require(`p-queue`);

const {
  createContentDigest
} = require("gatsby-core-utils");

const Debug = require("debug");

const generateBlurhash = require("./generate-blurhash");

const queue = new PQueue({
  concurrency: 1
});
const debug = Debug("gatsby-transformer-blurhash");

module.exports = async args => {
  const {
    type: {
      name
    }
  } = args;

  if (name === "ImageSharp") {
    return blurhashSharp(args);
  }

  return {};
};

async function blurhashSharp(args) {
  debugger;
  const {
    cache,
    getNodeAndSavePathDependency
  } = args;
  return {
    blurHash: {
      type: new GraphQLObjectType({
        name: "BlurhashSharp",
        fields: {
          base64Image: {
            type: GraphQLString
          },
          mask: {
            type: GraphQLString
          },
          hash: {
            type: GraphQLString
          }
        }
      }),
      args: {
        componentX: {
          type: GraphQLInt,
          defaultValue: 4
        },
        componentY: {
          type: GraphQLInt,
          defaultValue: 3
        },
        width: {
          type: GraphQLInt,
          defaultValue: 32
        }
      },

      async resolve(image, fieldArgs, context) {
        const file = getNodeAndSavePathDependency(image.parent, context.path);
        const {
          width: originalImageWidth,
          height: originalImageHeight
        } = await getImageSizeAsync(file);
        const {
          name
        } = file;
        const {
          contentDigest
        } = file.internal;
        const cacheKey = `${contentDigest}${createContentDigest(fieldArgs)}`;
        debug(`Request preview generation for ${name} (${cacheKey})`);
        return queue.add(async () => {
          let cachedResult = await cache.get(cacheKey);

          if (cachedResult) {
            debug(`Using cached data for ${name} (${cacheKey})`);
            return cachedResult;
          }

          try {
            debug(`Executing preview generation request for ${name} (${cacheKey})`);
            const result = await generateBlurhash(file.absolutePath, fieldArgs);
            await cache.set(cacheKey, result);
            return result;
          } catch (err) {
            err.message = `Unable to generate blurhash for ${name} (${cacheKey})\n${err.message}`;
            throw err;
          }
        });
      }

    }
  };
}