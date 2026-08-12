/**
 * Creates a new parser and grabs the data
 * from the data blocks. Then save that data
 * to the record.volume Object
 * See page 114; Section "Data Block #1" https://www.roc.noaa.gov/wsr88d/PublicDocs/ICDs/RDA_RPG_2620002P.pdf
 * @param {RandomAccessFile} raf The data as a RandomAccessFile
 * @returns {object} Formatted volume data
 */
const parseVolumeData = (raf) => ({
	block_type: raf.readString(1),
	name: raf.readString(3),
	size: raf.readShort(),
	version_major: raf.read(),
	version_minor: raf.read(),
	latitude: raf.readFloat(),
	longitude: raf.readFloat(),
	elevation: raf.readShort(),
	feedhorn_height: raf.readShort(),
	calibration: raf.readFloat(),
	tx_horizontal: raf.readFloat(),
	tx_vertical: raf.readFloat(),
	differential_reflectivity: raf.readFloat(),
	differential_phase: raf.readFloat(),
	volume_coverage_pattern: raf.readShort(),
	processing_status: raf.readShort(),
	zdr_bias_estimate: raf.readShort(),
});

/**
 * Creates a new parser and grabs the data
 * from the data blocks. Then save that data
 * to the record.elevation Object
 * See page 114; Section "Data Block #2" https://www.roc.noaa.gov/wsr88d/PublicDocs/ICDs/RDA_RPG_2620002P.pdf
 * @param {RandomAccessFile} raf The data as a RandomAccessFile
 * @returns {object} Formatted elevation data
 */
const parseElevationData = (raf) => ({
	block_type: raf.readString(1),
	name: raf.readString(3),
	size: raf.readShort(),
	atmos: raf.readShort(),
	calibration: raf.readFloat(),
});

/**
 * Creates a new parser and grabs the data
 * from the data blocks. Then save that data
 * to the record.radial Object
 * See page 115; Section "Data Block #3" https://www.roc.noaa.gov/wsr88d/PublicDocs/ICDs/RDA_RPG_2620002P.pdf
 * @param {RandomAccessFile} raf The data as a RandomAccessFile
 * @returns {object} Formatted radial data
 */
const parseRadialData = (raf) => ({
	block_type: raf.readString(1),
	name: raf.readString(3),
	size: raf.readShort(),
	unambiguous_range: raf.readShort() / 10,
	horizontal_noise_level: raf.readFloat(),
	vertical_noise_level: raf.readFloat(),
	nyquist_velocity: raf.readShort(),
	radial_flags: raf.readShort(),
	horizontal_calibration: raf.readFloat(),
	vertical_calibration: raf.readFloat(),
});

/**
 * Creates a new parser and grabs the data
 * from the data blocks. Then save that data
 * to the record.(reflect|velocity|spectrum|zdr|phi|rho)
 * Object base on what type being parsed
 * See page 115-117; Section "Data Block #4-9" https://www.roc.noaa.gov/wsr88d/PublicDocs/ICDs/RDA_RPG_2620002P.pdf
 * @param {RandomAccessFile} raf The data as a RandomAccessFile
 * @returns {object} Formatted moment data
 */
const parseMomentData = (raf) => {
	// initial offset for moment data
	const data = {
		block_type: raf.readString(1),
		name: raf.readString(3),
		spare: raf.read(4),
		gate_count: raf.readShort(),
		first_gate: raf.readShort() / 1000, // scale int to float 0.001 precision
		gate_size: raf.readShort() / 1000, // scale int to float 0.001 precision
		rf_threshold: raf.readShort() / 10, // scale int to float 0.1 precision
		snr_threshold: raf.readShort() / 1000, // scale int to float 0.001 precision
		control_flags: raf.read(),
		data_size: raf.read(),
		scale: raf.readFloat(),
		offset: raf.readFloat(),
		moment_data: [],
	};

	// allow for different sized data blocks
	const byteLength = data.data_size === 16 ? 2 : 1;

	// bulk-read the raw gate values in one pass, this avoids the function-call overhead
	// of reading one byte/short at a time, which matters here since a single file can
	// contain tens of millions of gate values across all of its radials and moments
	const rawValues = raf.readValues(data.gate_count, byteLength);

	// pre-allocate the output so it doesn't have to grow (and re-copy) on every push
	const { moment_data: momentData } = data;
	momentData.length = data.gate_count;
	const { offset, scale } = data;
	for (let i = 0; i < data.gate_count; i += 1) {
		const val = rawValues[i];
		// per documentation 0 = below threshold, 1 = range folding
		momentData[i] = val >= 2 ? (val - offset) / scale : null;
	}
	return data;
};

// return the block name and return the pointer to the begining of the block
// return false if "D" is not present at byte 0
const blockName = (raf) => {
	// get data
	const type = raf.readString(1);
	const name = raf.readString(3);

	// skip back
	raf.skip(-4);

	// basic data integrity check
	if (!(type === 'D' || type === 'R')) {
		throw new Error(`Invalid data block type: 0x${(type.charCodeAt(0) || 0).toString(16).padStart(2, '0')} at ${raf.getPos()}`);
	}
	return { name, type };
};

export {
	blockName,
	parseVolumeData,
	parseElevationData,
	parseRadialData,
	parseMomentData,
};
