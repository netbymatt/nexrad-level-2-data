const BIG_ENDIAN = 0;
const LITTLE_ENDIAN = 1;

class RandomAccessFile {
	/**
	 * Store a array or string and add functionality for random access
	 * Unless otherwise noted all read functions advance the file's pointer by the length of the data read
	 * @param {Uint8Array|string} file A file as a string or Uint8Array to load for random access
	 * @param {number} endian Endianess of the file constants BIG_ENDIAN and LITTLE_ENDIAN are provided
	 */
	constructor(file, endian = BIG_ENDIAN) {
		this.offset = 0;
		this.array = null;

		// set the binary endian order
		if (endian < 0) return;
		this.bigEndian = (endian === BIG_ENDIAN);

		// string to array if string was provided
		if (typeof file === 'string') {
			const encoder = new TextEncoder();
			this.array = encoder.encode(file);
		} else {
			// load the array directly
			this.array = file;
		}

		// set up local read functions so we don't constantly query endianess
		const outerView = new DataView(file.buffer);
		this.readFloatLocal = (offset) => outerView.getFloat32(offset, false);
		this.readIntLocal = (offset, byteLength) => {
			if (byteLength === 1) { return outerView.getUint8(offset); }
			if (byteLength === 2) { return outerView.getUint16(offset, !this.bigEndian); }
			if (byteLength === 4) { return outerView.getUint32(offset, !this.bigEndian); }
			throw new Error('Unsupported byteLength', byteLength);
		};
		this.readSignedIntLocal = (offset, byteLength) => {
			if (byteLength === 1) { return outerView.getInt8(offset); }
			if (byteLength === 2) { return outerView.getInt16(offset, !this.bigEndian); }
			if (byteLength === 4) { return outerView.getInt32(offset, !this.bigEndian); }
			throw new Error('Unsupported byteLength', byteLength);
		};
		const decoder = new TextDecoder();
		this.readStringLocal = (offset, byteLength) => decoder.decode(this.array.slice(offset, offset + byteLength));
	}

	/**
	 * Get array length
	 * @category Positioning
	 * @returns {number}
	 */
	getLength() {
		return this.array.length;
	}

	/**
	 * Get current position in the file
	 * @category Positioning
	 * @returns {number}
	 */
	getPos() {
		return this.offset;
	}

	/**
	 * Seek to a provided array offset
	 * @category Positioning
	 * @param {number} position Byte offset
	 */
	seek(position) {
		this.offset = position;
	}

	/**
	 * Read a string of a specificed length from the array
	 * @category Data
	 * @param {number} length Length of string to read
	 * @returns {string}
	 */
	readString(length) {
		const data = this.readStringLocal(this.offset, length);
		this.offset += length;

		return data;
	}

	/**
	 * Read a float from the array
	 * @category Data
	 * @returns {number}
	 */
	readFloat() {
		const float = this.readFloatLocal(this.offset);
		this.offset += 4;

		return float;
	}

	/**
	 * Read a 4-byte unsigned integer from the array
	 * @category Data
	 * @returns {number}
	 */
	readInt() {
		const int = this.readIntLocal(this.offset, 4);
		this.offset += 4;

		return int;
	}

	/**
	 * Read a 4-byte signed integer from the array
	 * @category Data
	 * @returns {number}
	 */
	readSInt4() {
		const int = this.readSignedIntLocal(this.offset, 4);
		this.offset += 4;

		return int;
	}

	/**
	 * Read a 2-byte unsigned integer from the array
	 * @category Data
	 * @returns {number}
	 */
	readShort() {
		const short = this.readIntLocal(this.offset, 2);
		this.offset += 2;

		return short;
	}

	/**
	 * Read a 2-byte signed integer from the array
	 * @category Data
	 * @returns {number}
	 */
	readSignedInt() {
		const short = this.readSignedIntLocal(this.offset, 2);
		this.offset += 2;

		return short;
	}

	/**
	 * Read a single byte from the array
	 * @category Data
	 * @returns {number}
	 */
	readByte() {
		return this.read();
	}

	// read a set number of bytes from the array
	/**
	 * Read a set number of bytes from the array
	 * @category Data
	 * @param {number} length Number of bytes to read
	 * @returns {number|number[]} number if length = 1, otherwise number[]
	 */
	read(length = 1) {
		let data = null;
		if (length > 1) {
			data = this.array.slice(this.offset, this.offset + length);
			this.offset += length;
		} else {
			data = this.array[this.offset];
			this.offset += 1;
		}

		return data;
	}

	/**
	 * Advance the pointer forward a set number of bytes
	 * @category Positioning
	 * @param {number} length Number of bytes to skip
	 */
	skip(length) {
		this.offset += length;
	}
}

module.exports.RandomAccessFile = RandomAccessFile;
module.exports.BIG_ENDIAN = BIG_ENDIAN;
module.exports.LITTLE_ENDIAN = LITTLE_ENDIAN;
