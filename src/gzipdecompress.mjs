import zlib from 'zlib';

// structured byte access
import { RandomAccessFile, BIG_ENDIAN } from './classes/RandomAccessFile.mjs';

const decompress = (raf) => {
	const data = zlib.gunzipSync(raf.array);
	return new RandomAccessFile(data, BIG_ENDIAN);
};

export default decompress;
