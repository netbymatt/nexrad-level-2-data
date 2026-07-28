import gulp from 'gulp';
import jsdoc2md from 'jsdoc-to-markdown';
import jsdoc from 'gulp-jsdoc3';
import fs from 'node:fs';
import { deleteAsync } from 'del';

const files = [
	'src/index.mjs',
	'src/parsedata.mjs',
	'src/typedefs.js',
	'src/classes/RandomAccessFile.mjs',
	'src/classes/Level2Record.mjs',
	'README.md',
];

const mdConfig = {
	files,
	configure: './jsdoc.conf.json',
	'global-index-format': 'grouped',
};

const htmlConfig = {
	opts: {
		destination: './docs',
	},
	configure: './jsdoc.conf.json',
};

gulp.task('docs', async () => {
	await deleteAsync(['API.md', 'docs/']);
	// eslint-disable-next-line n/no-sync
	await jsdoc2md.render(mdConfig).then((output) => fs.writeFileSync('API.md', output));
	return gulp.src(files, { read: false })
		.pipe(jsdoc(htmlConfig));
});
