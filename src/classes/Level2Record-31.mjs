import { MESSAGE_HEADER_SIZE } from '../constants.mjs';
import {
	blockName,
	parseVolumeData,
	parseElevationData,
	parseRadialData,
	parseMomentData,
} from './Level2Record-31.parsers.mjs';

// parse message type 31
export default (raf, message, offset, options) => {
	const record = {
		id: raf.readString(4),
		mseconds: raf.readInt(),
		julian_date: raf.readShort(),
		radial_number: raf.readShort(),
		azimuth: raf.readFloat(),
		compress_idx: raf.readByte(),
		sp: raf.readByte(),
		radial_length: raf.readShort(),
		ars: raf.readByte(),
		rs: raf.readByte(),
		elevation_number: raf.readByte(),
		cut: raf.readByte(),
		elevation_angle: raf.readFloat(),
		rsbs: raf.readByte(),
		aim: raf.readByte(),
		dcount: raf.readShort(),
	};

	// basic data integrity check
	try {
		if (!record.id.match(/[A-Z]{4}/)) throw new Error(`Invalid record id: ${record.id}`);
		if (record.mseconds > 86401000) throw new Error(`Invalid timestamp (ms): ${record.mseconds}`); // account for leap second
	} catch (e) {
		// return the un-altered message
		options.logger.warn(e.message);
		return message;
	}
	message.record = record;

	/**
	 * Read and save the data pointers from the file
	 * so we know where to start reading within the file
	 * to grab the data from the data blocks
	 * See page 114 of https://www.roc.noaa.gov/wsr88d/PublicDocs/ICDs/RDA_RPG_2620002P.pdf
	 */
	const dbp = [];
	for (let i = 0; i < 9; i += 1) {
		const pointer = raf.readInt();
		if (i < message.record.dcount) dbp.push(pointer);
	}

	/**
	 * Parse all of our data inside the datablocks
	 * and save it to the message.record Object
	 */

	// block type to friendly name conversion
	const blockTypesFriendly = {
		VOL: 'volume',
		ELE: 'elevation',
		RAD: 'radial',
		REF: 'reflect',
		VEL: 'velocity',
		'SW ': 'spectrum',	// intentional space to fill 3-character requirement
		ZDR: 'zdr',
		PHI: 'phi',
		RHO: 'rho',
	};

	// convert halfwords to bytes for message size
	const messageSizeBytes = message.message_size * 2;

	// hold a previous data block until the next data block is verified as valid
	let prevRecord = false;
	let prevBlockStart = 0;
	// process blocks, the order of the blocks is not guaranteed so the name must be used to select proper parser
	for (let i = 0; i < dbp.length; i += 1) {
		// jump to record position
		const parserStartPos = dbp[i] + offset + MESSAGE_HEADER_SIZE;
		raf.seek(parserStartPos);

		try {
			const { name } = blockName(raf);
			// no error was thrown, store the previous record
			if (prevRecord && blockTypesFriendly[prevRecord.name]) {
				// store the record under a friendly name
				message.record[blockTypesFriendly[prevRecord.name]] = prevRecord;
			}
			// reset the previous record
			prevRecord = false;

			// length check
			if (dbp[i] < messageSizeBytes) {
				// get the record based on known block names
				let thisRecord = false;
				switch (name) {
					case 'VOL':
						thisRecord = parseVolumeData(raf);
						break;
					case 'ELV':
						thisRecord = parseElevationData(raf);
						break;
					case 'RAD':
						thisRecord = parseRadialData(raf);
						break;
					default:
						thisRecord = parseMomentData(raf);
				}
				// store returned value for validation checking on next block
				prevRecord = thisRecord;
			} else {
				throw new Error(`Block overruns file at ${raf.getPos()}`);
			}
			// store the previous block position since this block was ok
			prevBlockStart = parserStartPos;
		} catch (e) {
			options.logger.warn(e.message);
			// clear out the previous record
			prevRecord = false;

			// set flag to search for next block
			message.endedEarly = prevBlockStart;
			break;
		}
	}

	// we can't yet check the integrity of the last block so we'll just accept that it's correct for now
	if (prevRecord && blockTypesFriendly[prevRecord.name]) {
		// store the record under a friendly name
		message.record[blockTypesFriendly[prevRecord.name]] = prevRecord;
	}

	return message;
};
