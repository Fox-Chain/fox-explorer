module.exports = {
    extends: ['@commitlint/config-conventional'],
    rules: {
        'type-enum': [2, 'always', ['build', 'ci', 'devop', 'chore', 'docs', 'feat', 'fix', 'refactor', 'revert', 'style', 'lint', 'test', 'translations']]
    }
}
