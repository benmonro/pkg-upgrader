import util from '../src/util';

test('sortByVersion', () => {
	const releases = [
		{version: '1.0.1'},
		{version: '88.0.1'},
		{version: '0.0.1'},
		{version: '1.0.0'},
		{version: '1.10.0'},
		{version: '1.2.0'}
	];

	expect(releases.sort(util.sortByVersion)).toEqual([
		{version: '0.0.1'},
		{version: '1.0.0'},
		{version: '1.0.1'},
		{version: '1.2.0'},
		{version: '1.10.0'},
		{version: '88.0.1'}
	]);
});

test('getVersions should sort releases and prepend with a "older than" release', () => {
	const releases = [
		{version: '1.0.1'},
		{version: '88.0.1'},
		{version: '0.0.1'},
		{version: '1.0.0'},
		{version: '1.10.0'},
		{version: '1.2.0'}
	];

	expect(util.getVersions(releases)).toEqual([{
		name: 'older than 0.0.1',
		value: '0.0.0'
	}, {
		name: '0.0.1',
		value: '0.0.1'
	}, {
		name: '1.0.0',
		value: '1.0.0'
	}, {
		name: '1.0.1',
		value: '1.0.1'
	}, {
		name: '1.2.0',
		value: '1.2.0'
	}, {
		name: '1.10.0',
		value: '1.10.0'
	}, {
		name: '88.0.1 (latest)',
		value: '88.0.1'
	}]);
});

test('getVersions should work with a single release', () => {
	const releases = [
		{version: '1.0.0'}
	];

	expect(util.getVersions(releases)).toEqual([{
		name: 'older than 1.0.0',
		value: '0.0.0'
	},
	{
		name: '1.0.0 (latest)',
		value: '1.0.0'
	}]);
});

describe('indexOfVersion', () => {
test('with lots of versions', () => {
	const versions = [
		{
			name: 'older than 0.0.1',
			value: '0.0.0'
		}, {
			name: '0.0.1',
			value: '0.0.1'
		}, {
			name: '1.0.0',
			value: '1.0.0'
		}, {
			name: '1.0.1',
			value: '1.0.1'
		}, {
			name: '1.2.0',
			value: '1.2.0'
		}, {
			name: '1.10.0',
			value: '1.10.0'
		}, {
			name: '88.0.1 (latest)',
			value: '88.0.1'
		}
	];

	expect(util.indexOfVersion(versions, '0.0.0')).toBe(0);
	expect(util.indexOfVersion(versions, '0.0.1')).toBe(1);
	expect(util.indexOfVersion(versions, '0.0.2')).toBe(2);
	expect(util.indexOfVersion(versions, '1.0.0')).toBe(2);
	expect(util.indexOfVersion(versions, '1.0.1')).toBe(3);
	expect(util.indexOfVersion(versions, '1.2.0')).toBe(4);
	expect(util.indexOfVersion(versions, '1.10.0')).toBe(5);
	expect(util.indexOfVersion(versions, '88.0.1')).toBe(6);
	expect(util.indexOfVersion(versions, '76.876.321')).toBe(6);
});

test('with just one version', () => {
	const versions = [
		{name:"3.1.0", value:"3.1.0"}
	];

	expect(util.indexOfVersion(versions, '2.1.0')).toBe(0);
})
});
test('takeVersionsAfter', () => {
	const versions = [
		{
			name: 'older than 0.0.1',
			value: '0.0.0'
		}, {
			name: '0.0.1',
			value: '0.0.1'
		}, {
			name: '1.0.0',
			value: '1.0.0'
		}, {
			name: '1.0.1',
			value: '1.0.1'
		}, {
			name: '1.2.0',
			value: '1.2.0'
		}, {
			name: '1.10.0',
			value: '1.10.0'
		}, {
			name: '88.0.1 (latest)',
			value: '88.0.1'
		}
	];

	expect(util.takeVersionsAfter(versions, '1.0.0')).toEqual([
		{
			name: '1.0.1',
			value: '1.0.1'
		}, {
			name: '1.2.0',
			value: '1.2.0'
		}, {
			name: '1.10.0',
			value: '1.10.0'
		}, {
			name: '88.0.1 (latest)',
			value: '88.0.1'
		}
	]);

	expect(util.takeVersionsAfter(versions, '0.0.0')).toEqual([
		{
			name: '0.0.1',
			value: '0.0.1'
		}, {
			name: '1.0.0',
			value: '1.0.0'
		}, {
			name: '1.0.1',
			value: '1.0.1'
		}, {
			name: '1.2.0',
			value: '1.2.0'
		}, {
			name: '1.10.0',
			value: '1.10.0'
		}, {
			name: '88.0.1 (latest)',
			value: '88.0.1'
		}
	]);
});

test('selectTransforms', () => {
	const releases = [{
		version: '0.14.0',
		transforms: [
			'lib/ok-to-truthy.js',
			'lib/same-to-deep-equal.js'
		]
	}, {
		version: '0.15.0',
		transforms: [
			'lib/script-0.15.0.js'
		]
	}, {
		version: '1.0.0',
		transforms: [
			'lib/script-1.0.0.js'
		]
	}, {
		version: '2.0.0',
		transforms: [
			'lib/script-2.0.0.js'
		]
	}];

	expect(util.selectTransforms(releases, '0.14.0', '0.14.0')).toEqual([]);

	expect(util.selectTransforms(releases, '0.14.0', '1.0.0')).toEqual([
		'lib/script-0.15.0.js',
		'lib/script-1.0.0.js'
	]);

	expect(util.selectTransforms(releases, '0.0.0', '0.15.0')).toEqual([
		'lib/ok-to-truthy.js',
		'lib/same-to-deep-equal.js',
		'lib/script-0.15.0.js'
	]);

	expect(util.selectTransforms(releases, '0.13.5', '0.15.5')).toEqual([
		'lib/ok-to-truthy.js',
		'lib/same-to-deep-equal.js',
		'lib/script-0.15.0.js'
	]);

	expect(util.selectTransforms(releases, '0.13.5', '0.14.0')).toEqual([
		'lib/ok-to-truthy.js',
		'lib/same-to-deep-equal.js'
	]);

	expect(util.selectTransforms(releases, '0.0.0', '9999.9999.9999')).toEqual([
		'lib/ok-to-truthy.js',
		'lib/same-to-deep-equal.js',
		'lib/script-0.15.0.js',
		'lib/script-1.0.0.js',
		'lib/script-2.0.0.js'
	]);

	expect(util.selectTransforms(releases, '0.13.0', '0.15.0')).toEqual([
		'lib/ok-to-truthy.js',
		'lib/same-to-deep-equal.js',
		'lib/script-0.15.0.js'
	]);

	expect(util.selectTransforms(releases, '9999.9999.9999', '0.0.0')).toEqual([]);
});

test('coerce versions', () => {
	const releases = [
		{version: '0.10.0', transforms:['a.js']},
		{version: '0.12.0', transforms:['b.js']},
		{version: '0.13.0', transforms:['c.js']},
		{version: '1.0.0', transforms:['d.js']},
		{version: '2.0.0', transforms:['e.js']},
		{version: '4.0.0', transforms:['f.js']}
	];

	expect(util.selectTransforms(releases, '0.10', '2')).toEqual([
		'b.js',
		'c.js',
		'd.js',
		'e.js'
	]);
});

test('resolvePath', () => {
	const path = 'lib/ok-to-truthy.js';
	const dirname = '/some/path';

	expect(util.resolvePath(dirname)(path)).toBe('/some/path/lib/ok-to-truthy.js');
});

test('listUpgrades', () => {
	const releases = [
		{version: '0.10.0'},
		{version: '0.12.0'},
		{version: '0.13.0'},
		{version: '1.0.0'},
		{version: '2.0.0'},
		{version: '4.0.0'}
	];

	expect(util.listUpgrades(releases)).toEqual([
		'  - [] → 0.10.0',
		'  - 0.10.0 → 0.12.0',
		'  - 0.12.0 → 0.13.0',
		'  - 0.13.0 → 1.0.0',
		'  - 1.0.0 → 2.0.0',
		'  - 2.0.0 → 4.0.0'
	]);
});
