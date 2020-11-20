const sharp = require("sharp");
const blurhash = require("blurhash");

const generateBlurhash = async (imageAbsolutePath, fieldArgs) => {
  const { componentX, componentY, width } = fieldArgs;

  if (componentX > 9 || componentX < 1) {
    throw new Error("componentX must be (1-9)");
  }
  if (componentY > 9 || componentY < 1) {
    throw new Error("componentY must be (1-9)");
  }

  const {
    data: rawResizedImageBuffer,
    info: rawResizedImageInfo,
  } = await sharp(imageAbsolutePath)
    .resize(width)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rawResizedImageByteArray = Uint8ClampedArray.from(
    rawResizedImageBuffer
  );

  const blurhashed = blurhash.encode(
    rawResizedImageByteArray,
    rawResizedImageInfo.width,
    rawResizedImageInfo.height,
    componentX,
    componentY
  );

  const blurhashedImageByteArray = blurhash.decode(
    blurhashed,
    rawResizedImageInfo.width,
    rawResizedImageInfo.height
  );

  const blurhashedPngImageBuffer = await sharp(
    Buffer.from(blurhashedImageByteArray),
    {
      raw: {
        width: rawResizedImageInfo.width,
        height: rawResizedImageInfo.height,
        channels: rawResizedImageInfo.channels,
      },
    }
  )
    .png()
    .toBuffer();

  return {
    hash: blurhashed,
    base64Image: `data:image/png;base64,${blurhashedPngImageBuffer.toString(
      "base64"
    )}`,
  };
};

module.exports = generateBlurhash;
