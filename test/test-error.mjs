/* eslint-disable no-console */
import fs from 'node:fs/promises';
import Level2Radar from '../src/index.mjs';

// these files should contain the same error
const fileToLoadError = './data/messagesizeerror';
// const fileToLoadError = 'data/KLOT20210625_075708_V06';

// load file
const dataError = await fs.readFile(fileToLoadError);

const radarError = new Level2Radar(dataError);
console.log(radarError);

// error is in elevation 10
radarError.setElevation(10);
const reflectivityCompressed = radarError.getHighresReflectivity();
console.log(reflectivityCompressed);
