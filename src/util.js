import path from "path";
import semver from "semver";

function sortByVersion(a, b) {
	if (a.version === b.version) {
		return 0;
	}
	return semver.lt(a.version, b.version) ? -1 : +1;
}

function getVersions(releases) {
	const releaseVersions = releases
		.sort(sortByVersion)
		.map(release => release.version);

	const firstVersion = {
		name: `older than ${releaseVersions[0]}`,
		value: "0.0.0"
	};
	const lastVersionValue = releaseVersions[releaseVersions.length - 1];
	const lastVersion = {
		name: `${lastVersionValue} (latest)`,
		value: lastVersionValue
	};

	return [firstVersion]
		.concat(
			releaseVersions.slice(0, -1).map(version => ({
				name: version,
				value: version
			}))
		)
		.concat(lastVersion);
}

function indexOfVersion(versions, version) {
	version = semver.coerce(version);
	if(version === null) {
		return -1;
	}
	if(semver.lte(version, versions[0].value)) {
		return 0;
	}

	return versions.findIndex(v => semver.gte(v.value,version));
}

function takeVersionsAfter(versions, chosen) {
	return versions.slice(indexOfVersion(versions, chosen) + 1);
}

function selectVersions(releases, currentVersion, nextVersion) {
	const semverToRespect = `>${currentVersion} <=${nextVersion}`;

	return releases
		.filter(release => semver.satisfies(release.version, semverToRespect))
		.map(({version}) => version);
}

function selectTransforms(releases, currentVersion, nextVersion) {
	const semverToRespect = `>${currentVersion} <=${nextVersion}`;

	const transforms = releases
		.filter(release => semver.satisfies(release.version, semverToRespect))
		.map(({transforms}) => transforms);
	return transforms.reduce( (a, b) => a.concat(b), []);
}

function resolvePath(dirname) {
	return filePath => path.resolve(dirname, filePath);
}

function listUpgrades(releases) {
	let current = "[]";
	return releases.map(release => {
		const res = `  - ${current} → ${release.version}`;
		current = release.version;
		return res;
	});
}

export default {
	sortByVersion,
	getVersions,
	indexOfVersion,
	takeVersionsAfter,
	selectTransforms,
	selectVersions,
	resolvePath,
	listUpgrades
};
