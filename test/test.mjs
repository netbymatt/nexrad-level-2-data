/* eslint-disable no-console */
import fs from 'fs/promises';
import { Level2Radar } from '../src/index.mjs';

// const fileToLoad = './data/non-hi-res/KLOT19950413_132143.gz'; // The radar archive file to load
const fileToLoad = './data/KLOT20200715_230602_V06'; // The radar archive file to load
// const fileToLoadCompressed = './data/KLOT20200715_230602_V06'; // The radar archive file to load
// const fileToLoadError = './data/messagesizeerror';

// load file into buffer
const data = await fs.readFile(fileToLoad);
console.time('load-uncompressed');

const radar = new Level2Radar(data);
console.timeEnd('load-uncompressed');
const reflectivity = radar.getHighresReflectivity();
console.log(reflectivity);
radar.getHeader();
