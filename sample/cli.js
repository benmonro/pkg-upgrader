#!/usr/bin/env node

import upgrader from 'pkg-upgrader';
import pkg from './package.json';
import releases from './releases.json';

const settings = {
	libraryName: 'Your library name',
	releases,
	pkg,
	dirname: __dirname
};

upgrader.handleCliArgs(settings)
	.then(upgrader.checkForUpdates)
	.then(upgrader.checkGitIsClean)
	.then(upgrader.prompt)
	.then(upgrader.applyCodemods)
	.then(upgrader.printTip)
	.catch(({message}) => {
		console.error(message);
		process.exit(1);
	});
