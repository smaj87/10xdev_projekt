import packageJson from '../../package.json' with { type: 'json' };

const version = packageJson?.version || 'unknown';
const dirVersion = `v${version.replace(/\.+/gi, '_')}`;

export { dirVersion, version };
