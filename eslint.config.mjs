import path from 'node:path';

import { includeIgnoreFile } from '@eslint/compat';
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import { configs, plugins } from 'eslint-config-airbnb-extended';
import jsdoc from 'eslint-plugin-jsdoc';

const gitignorePath = path.resolve('.', '.gitignore');

const jsConfig = defineConfig([
	// ESLint recommended config
	{
		name: 'js/config',
		...js.configs.recommended,
	},
	// Stylistic plugin
	plugins.stylistic,
	// Import X plugin
	plugins.importX,
	// Airbnb base recommended config
	...configs.base.recommended,
	// jsdoc recommended rules (optional — only if you want its default rule set)
	jsdoc.configs['flat/recommended'],
]);

const nodeConfig = defineConfig([
	// Node plugin
	plugins.node,
	// Airbnb Node recommended config
	...configs.node.recommended,
]);

const rules = {
	'@stylistic/indent': ['error', 'tab', { SwitchCase: 1 }],
	'@stylistic/no-tabs': 0,
	'no-param-reassign': [
		'error',
		{
			props: false,
		},
	],
	'@stylistic/max-len': 0,
	'no-underscore-dangle': [
		'error',
		{
			allowAfterThis: true,
		},
	],
	'import-x/no-useless-path-segments': 0,
	'no-bitwise': 0,
	'import-x/extensions': [
		'error',
		'ignorePackages',
		{
			js: 'always',
			mjs: 'always',
			json: 'always',
		},
	],
	'jsdoc/require-property-description': 0,
	'jsdoc/require-returns-description': 0,
	'jsdoc/no-undefined-types': 0,
	// "jsdoc/valid-types": 0,
	'jsdoc/check-tag-names': [
		'error',
		{
			definedTags: [
				'category',
			],
		},
	],

};

const languageOptions = {
	ecmaVersion: 'latest',
	parserOptions: {
		ecmaVersion: 'latest',
	},
};

const ignores = [
	'docs/**',
];

export default defineConfig([
	{
		ignores,
	},
	// Ignore files and folders listed in .gitignore
	includeIgnoreFile(gitignorePath),
	// JavaScript config
	...jsConfig,
	// Node config
	...nodeConfig,
	{
		languageOptions,
		rules,
	},
]);
