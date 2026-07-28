import zlib from 'node:zlib';

// structured byte access
import { RandomAccessFile, BIG_ENDIAN } from './classes/RandomAccessFile.mjs';

const gzipDecompress = (raf) => {
	// eslint-disable-next-line n/no-sync
	const data = zlib.gunzipSync(raf.array);
	return new RandomAccessFile(data, BIG_ENDIAN);
};

export default gzipDecompress;
