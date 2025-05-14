/* eslint-disable no-console */
import fs from 'fs';
import { Level2Radar } from '../src/index.mjs';

const fileToLoad = './data/KLOT20200715_230602_V06'; // The radar archive file to load

Math.radians = (degrees) => degrees * Math.PI / 180;

// load file into buffer
const data = await new Promise((resolve) => {
	fs.readFile(fileToLoad, (err, fileData) => {
		resolve(fileData);
	});
});
console.time('load');

const radar = new Level2Radar(data);
console.timeEnd('load');
const reflectivity = radar.getHighresReflectivity();

console.log(reflectivity);
