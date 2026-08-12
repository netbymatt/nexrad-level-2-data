// decompress a nexrad level 2 archive, or return the provided file if it is not compressed

// bzip, wasm build of the real libbzip2 so decoding runs at native speed instead of
// interpreted byte-at-a-time javascript
import Bzip2 from '@foxglove/wasm-bz2';

// gzip
import gzipDecompress from './gzipdecompress.mjs';

// structured byte access
import { RandomAccessFile, BIG_ENDIAN } from './classes/RandomAccessFile.mjs';

// constants
import { FILE_HEADER_SIZE } from './constants.mjs';

// initialize the wasm module once for the lifetime of the process. this is a top-level
// await which does mean this module (and anything that imports it) can only be consumed
// via `import`/`import()`, not `require()` (node cannot require() an esm graph that
// contains a top-level await)
const bzip2 = await Bzip2.init();

// compression header is (int) size of block + 'BZh' + one character block size
const readCompressionHeader = (raf) => ({
	size: raf.readInt(),
	header: raf.readString(3),
	block_size: raf.readString(1),
});

/**
 * Decompress a single bzip2-compressed record. The exact decompressed size isn't known up
 * front, so start with a generous guess (NEXRAD records have historically decompressed to
 * roughly 3-4x their compressed size) and grow it if that guess turns out to be too small.
 * @param {Uint8Array} compressed A single, complete bzip2 stream (starting with the 'BZh' magic)
 * @returns {Uint8Array} Decompressed data
 */
const decompressBlock = (compressed) => {
	let destSize = compressed.length * 6;
	for (let attempt = 0; ; attempt += 1) {
		try {
			return bzip2.decompress(compressed, destSize, { small: false });
		} catch (e) {
			// BZ_OUTBUFF_FULL means destSize was too small, double it and try again
			if (attempt >= 5 || !e.message.includes('BZ_OUTBUFF_FULL')) throw e;
			destSize *= 2;
		}
	}
};

const decompress = (raf) => {
	// detect gzip header
	const gZipHeader = raf.read(2);
	raf.seek(0);
	if (gZipHeader[0] === 31 && gZipHeader[1] === 139) return gzipDecompress(raf);

	// if file length is less than or equal to the file header size then it is not compressed
	if (raf.getLength() <= FILE_HEADER_SIZE) return raf;
	let headerSize = 0;
	// get the compression record
	const compressionRecord = readCompressionHeader(raf);

	// test for the magic number 'BZh' for a bzip compressed file
	if (compressionRecord.header !== 'BZh') {
		// not compressed, try again with after skipping the file header (first chunk or complete archive)
		raf.seek(0);
		raf.skip(FILE_HEADER_SIZE);
		headerSize = FILE_HEADER_SIZE;
		const fullCompressionRecord = readCompressionHeader(raf);
		if (fullCompressionRecord.header !== 'BZh') {
			// not compressed in either form, return the original file at the begining
			raf.seek(0);
			return raf;
		}
	}
	// compressed file, start decompressing
	// the format is (int) size of block + 'BZh9' + compressed data block, repeat
	// start by locating the begining of each compressed block by jumping to each offset noted by the size header
	const positions = [];
	// jump back before the first detected compression header
	raf.seek(raf.getPos() - 8);

	// loop until the end of the file is reached
	while (raf.getPos() < raf.getLength()) {
		// block size may be negative
		const size = Math.abs(raf.readSInt4());
		// store the position
		positions.push({
			pos: raf.getPos(),
			size,
		});
		// jump forward
		raf.seek(raf.getPos() + size);
	}

	// reuse the original header if present
	const outArrays = [raf.array.slice(0, headerSize)];

	// loop through each block and decompress it
	positions.forEach((block) => {
		// extract the block from the array, subarray avoids a copy since the wasm call
		// copies the bytes into its own heap anyway
		const compressed = raf.array.subarray(block.pos, block.pos + block.size);
		const output = decompressBlock(compressed);
		outArrays.push(output);
	});

	// combine the arrays
	const outArray = new Uint8Array(outArrays.reduce((sum, cur) => sum + cur.length, 0));
	outArrays.reduce((offset, currentArray) => {
		outArray.set(currentArray, offset);
		return offset + currentArray.length;
	}, 0);

	// pass the array to RandomAccessFile and return the result
	return new RandomAccessFile(outArray, BIG_ENDIAN);
};

export default decompress;
