// parse message type 5 and 7
import {
	supplementalData,
	azimuthRate,
	parse360Angle,
	velocityResolution,
	pulseWidth,
	vcpSequencing,
	vcpSupplemental,
	superResControl,
} from './Level2Record-5-7.parsers.mjs';

export default (raf, message) => {
	message.record = {
		message_size: raf.readShort(),
		pattern_type: raf.readShort(),
		pattern_number: raf.readShort(),
		num_elevations: raf.readShort(),
		version: raf.readByte(),
		clutter_number: raf.readByte(),
		velocity_resolution: velocityResolution(raf.readByte()),
		pulse_width: pulseWidth(raf.readByte()),
		reserved1: raf.readInt(),
		vcp_sequencing: vcpSequencing(raf.readShort()),
		vcp_supplemental: vcpSupplemental(raf.readShort()),
		reserved2: raf.readShort(),
	};

	// read each elevation
	message.record.elevations = [];

	// because the NOAA spec is 1 based, a sparse array is used to match with elevation numbering in the .data section of the object
	for (let i = 1; i <= message.record.num_elevations; i += 1) {
		const elev = {
			elevation_angle: parse360Angle(raf.readShort()),
			channel_config: raf.readByte(),
			waveform_type: raf.readByte(),
			super_res_control: superResControl(raf.readByte()),
			surv_prf_number: raf.readByte(),
			surv_prf_pulse: raf.readShort(),
			azimuth_rate: azimuthRate(raf.readShort()),
			ref_threshold: raf.readShort(),
			vel_threshold: raf.readShort(),
			sw_threshold: raf.readShort(),
			diff_ref_threshold: raf.readShort(),
			diff_ph_threshold: raf.readShort(),
			cor_coeff_threshold: raf.readShort(),
			edge_angle_s1: parse360Angle(raf.readShort()),
			prf_num_s1: raf.readShort(),
			prf_pulse_s1: raf.readShort(),
			supplemental_data: supplementalData(raf.readShort()),
			edge_angle_s2: parse360Angle(raf.readShort()),
			prf_num_s2: raf.readShort(),
			prf_pulse_s2: raf.readShort(),
			ebc_angle: parse360Angle(raf.readShort()),
			edge_angle_s3: parse360Angle(raf.readShort()),
			prf_num_s3: raf.readShort(),
			prf_pulse_s3: raf.readShort(),
			reserved: raf.readShort(),
		};
		message.record.elevations[i] = elev;
	}

	return message;
};
