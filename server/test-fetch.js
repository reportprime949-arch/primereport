const { NewsFetcher } = require('./rss-fetcher');
NewsFetcher.refreshAll()
    .then(r => console.log('Success:', r.length))
    .catch(e => console.error('FAIL:', e));
