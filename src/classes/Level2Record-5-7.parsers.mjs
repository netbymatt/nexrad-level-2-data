// extract bits (inclusive) and return as an int, or boolean if single bit
const parseBits = (raw, start, end) => {
	if (end !== undefined) {
		let val = 0;
		for (let i = start; i <= end; i += 1) {
			if (raw & 2 ** i) val += 2 ** (i - start);
		}
		return val;
	}
	return ((raw & 2 ** start) > 0);
};

// parse an angle 0-360
// bit 15 = 180, halves from there with 3 being the least significant bit
const parse360Angle = (raw) => {
	let angle = 0;
	for (let i = 15; i >= 3; i -= 1) {
		if (parseBits(raw, i)) angle += 180 / 2 ** (15 - i);
	}
	return angle;
};

// parse velocity resolution
const velocityResolution = (raw) => {
	if (raw === 2) return 0.5;
	return 1.0;
};

// parse pulse width
const pulseWidth = (raw) => {
	if (raw === 2) return 'short';
	return 'Long';
};

// parse vcp sequencing
const vcpSequencing = (raw) => ({
	elevations: parseBits(raw, 0, 4),
	max_sails_cuts: parseBits(raw, 5, 6),
	sequence_active: parseBits(raw, 13),
	truncated_vcp: parseBits(raw, 14),
});

// parse vcp supplemental data
const vcpSupplemental = (raw) => ({
	sails_vcp: parseBits(raw, 0),
	number_sails_cuts: parseBits(raw, 1, 3),
	mrle_vcp: parseBits(raw, 4),
	number_mrle_cuts: parseBits(raw, 5, 7),
	mpda_vcp: parseBits(raw, 11),
	base_tilt_vcp: parseBits(raw, 12),
	number_base_tilts: parseBits(raw, 13, 15),
});

// parse super resolution control
const superResControl = (raw) => ({
	super_res: {
		halfDegreeAzimuth: parseBits(raw, 0),
		quarterKm: parseBits(raw, 1),
		'300km': parseBits(raw, 2),
	},
	dual_pol: {
		'300km': parseBits(raw, 3),
	},
});

// parse azimuth rate
const azimuthRate = (raw) => {
	let rate = 0;
	for (let i = 14; i >= 3; i -= 1) {
		if (parseBits(raw, i)) rate += 22.5 / 2 ** (14 - i);
	}
	// negate for sign bit if necessary
	if (parseBits(raw, 15)) rate = -rate;
	return rate;
};

// parse elevation supplemental data
const supplementalData = (raw) => ({
	sails_cut: parseBits(raw, 0),
	sails_sequence: parseBits(raw, 1, 3),
	mrle_cut: parseBits(raw, 4),
	mrle_sequence: parseBits(raw, 5, 7),
	mpda_cut: parseBits(raw, 9),
	base_tilt_cut: parseBits(raw, 10),
});

export {
	supplementalData,
	azimuthRate,
	parse360Angle,
	velocityResolution,
	pulseWidth,
	vcpSequencing,
	vcpSupplemental,
	superResControl,
};
