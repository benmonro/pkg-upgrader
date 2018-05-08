import meow from 'meow';
import globby from 'globby';
import Promise from 'bluebird';
import inquirer from 'inquirer';
import assign from 'lodash.assign';
import isGitClean from 'is-git-clean';
import updateNotifier from 'update-notifier';
import Runner from 'jscodeshift/dist/Runner.js';
import util from './util';
import chalk from 'chalk';

function runTransforms(settings, transforms, files) {
	return Promise.mapSeries(transforms, transform => Runner.run(transform, files, settings));
}

function cliArgs({pkg:{name,description,version}, libraryName},releases) {
	const upgrades = util.listUpgrades(releases);
	const help = [
		'Usage',
		`  $ ${name} [<file|glob> ...]`,
		'',
		'Options',
		`  --from <version> Specify the version of ${libraryName} currently used`,
		`  --to <version>   Specify the version of ${libraryName} to move to`,
		'  --force, -f      Bypass safety checks and forcibly run codemods',
		'  --silent, -S     Disable log output',
		'',
		'Available upgrades'
	].concat(upgrades);

	return meow({
		description,
		version,
		help
	}, {
		boolean: ['force', 'silent'],
		string: ['_', 'from', 'to'],
		alias: {
			f: 'force',
			S: 'silent',
			h: 'help'
		}
	});
}

function versionsAfter(versions, versionIndex, {from}) {
	let version = from;
	if (versionIndex !== -1) {
		version = versions[versionIndex].value;
	}
	return util.takeVersionsAfter(versions, version);
}

function getQuestions(settings, versions) {
	function truthy(v) {
		return v;
	}
	const name = settings.libraryName;
	const from = util.indexOfVersion(versions, settings.from);
	const to = util.indexOfVersion(versions, settings.to);

	return [{
		type: 'list',
		name: 'from',
		message: `What version of ${name} are you currently using?`,
		choices: versions.slice(0, -1),
		default: (from !== -1 && from) || undefined,
		when: from === -1
	}, {
		type: 'list',
		name: 'to',
		message: `What version of ${name} are you moving to?`,
		choices: (to !== -1 && to) || (answers => versionsAfter(versions, from, answers)),
		default(answers) {
			return versionsAfter(versions, from, answers).length - 1;
		},
		when: to === -1
	}, {
		type: 'input',
		name: 'files',
		message: 'On which files should the codemods be applied?',
		default: settings.files,
		when: !settings.files || settings.files.length === 0,
		filter(files) {
			return files.trim().split(/\s+/).filter(truthy);
		}
	}];
}

function checkAndRunTransform(settings, transforms, files) {
	if (transforms.length === 0) {
		console.log('No transforms to apply');
		return Promise.resolve();
	}

	const foundFiles = globby.sync(files);
	if (foundFiles.length === 0) {
		console.log('No files to transform');
		return Promise.resolve();
	}

	return runTransforms(settings, transforms, foundFiles);
}

function printTip(settings) {
	if(settings.silent) {
		return Promise.resolve(settings);
	}
	console.log('\nFor similar projects, you may want to run the following command:');
	console.log(
		`    ${settings.pkg.name} --from ${settings.from} --to ${settings.to} ${settings.files.map(JSON.stringify).join(' ')}`
	);

	const releases = settings.releases.slice().sort(util.sortByVersion);
	const selectedVersions = util.selectVersions(releases, settings.from, settings.to);
	console.log("\nApplying Versions:");
	console.log('    ',chalk.white(selectedVersions.join(', ')), '\n');

	return Promise.resolve(settings);
}

function applyCodemods(settings) {
	if (!settings.files || settings.files.length === 0) {
		return Promise.resolve(settings);
	}

	const releases = settings.releases.slice().sort(util.sortByVersion);
	const transforms = util.selectTransforms(releases, settings.from, settings.to)
		.map(util.resolvePath(settings.dirname));

	return checkAndRunTransform(settings, transforms, settings.files)
		.return(settings);
}

function showVerions(settings) {
	if (!settings.files || settings.files.length === 0) {
		return Promise.resolve(settings);
	}

	const releases = settings.releases.slice().sort(util.sortByVersion);
	const selectedVersions = util.selectVersions(releases, settings.from, settings.to);
	console.log("Applying Versions:\n");
	console.log(selectedVersions.join('\n'));
	return Promise.resolve(settings);
}

function checkGitIsClean(settings) {
	let clean = false;
	let errorMessage = 'Unable to determine if git directory is clean';
	try {
		clean = isGitClean.sync();
		errorMessage = 'Git directory is not clean';
	} catch (e) {
	}

	const ENSURE_BACKUP_MESSAGE = 'Ensure you have a backup of your tests or commit the latest changes before continuing.';

	if (!clean) {
		if (settings.force) {
			console.log(`WARNING: ${errorMessage}. Forcibly continuing.`);
			console.log(ENSURE_BACKUP_MESSAGE);
		} else {
			console.log(`ERROR: ${errorMessage}. Refusing to continue.`);
			console.log(ENSURE_BACKUP_MESSAGE);
			console.log('You may use the --force flag to override this safety check.');
			return Promise.reject(new Error(errorMessage));
		}
	}
	return Promise.resolve(settings);
}

function prompt(settings) {
	const releases = settings.releases.slice().sort(util.sortByVersion);

	const versions = util.getVersions(releases);
	const questions = getQuestions(settings, versions);

	return inquirer.prompt(questions)
	.then(answers => assign({}, settings, answers));
}

function handleCliArgs(settings) {
	const releases = settings.releases.slice().sort(util.sortByVersion);
	const args = cliArgs(settings, releases);
	const newSettings = assign({files: args.input}, settings, args.flags);
	return Promise.resolve(newSettings);
}

function checkForUpdates(settings) {
	updateNotifier({pkg: settings.pkg}).notify();
	return Promise.resolve(settings);
}

export default {
	applyCodemods,
	checkForUpdates,
	checkGitIsClean,
	handleCliArgs,
	printTip,
	prompt
};