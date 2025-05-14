const zlib = require('zlib');
// structured byte access
const { RandomAccessFile, BIG_ENDIAN } = require('./classes/RandomAccessFile');

module.exports = (raf) => {
	const data = zlib.gunzipSync(raf.array);
	return new RandomAccessFile(data, BIG_ENDIAN);
};
