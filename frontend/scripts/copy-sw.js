const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'service-worker.ts');
const destPublic = path.join(__dirname, '..', 'public', 'service-worker.js');
const destBuild = path.join(__dirname, '..', 'build', 'service-worker.js');

function toJS(tsSource) {
	// very naive strip of TypeScript types for this simple SW
	return tsSource
		.replace(/:\s*any/g, '')
		.replace(/export\s+/g, '')
		.replace(/interface[\s\S]*?\{/g, '')
		.replace(/}\s*$/g, '');
}

try {
	const ts = fs.readFileSync(src, 'utf8');
	const js = toJS(ts);
	fs.writeFileSync(destPublic, js, 'utf8');
	if (fs.existsSync(path.join(__dirname, '..', 'build'))) {
		fs.writeFileSync(destBuild, js, 'utf8');
	}
	console.log('Service worker prepared.');
} catch (e) {
	console.warn('Service worker copy failed:', e.message);
}
