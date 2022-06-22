module.exports = {
    client: {
        service: {
            name: 'api',
            url: 'http://localhost:4000/',
            includes: ['**/*.graphql'],
            excludes: ['node_modules/**/*']
        }
    }
}
