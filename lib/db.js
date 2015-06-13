var _ = require('lodash-node')
var Promise = require('bluebird')
var MongoDB = Promise.promisifyAll(require('mongodb'))
var ProgressBar = require('progress')
var Client = require('./Client')

function error(err) {
	console.log(err.stack)
}

var emptyResult = {
	nInserted: 0,
	nUpserted: 0,
	nMatched: 0,
	nModified: 0
}

function showResult(result) {
	console.log({
		nInserted: result.nInserted,
		nUpserted: result.nUpserted,
		nMatched: result.nMatched,
		nModified: result.nModified
	})
	return result
}

function upsertSeries(db, cd) {
	return cd.getSeries()
	.then(function(series) {
		var bulk = db.collection('series').initializeUnorderedBulkOp()
		series.forEach(function(series) {
			bulk.find({series_id: series.series_id}).upsert().updateOne(series)
		})
		return Promise.fromNode(bulk.execute.bind(bulk))
	})
	.then(showResult)
}

function upsertVolumes(db, cd) {
	return db
	.collection('series')
	.find({}, {series_id: 1})
	.toArrayAsync()
	.then(function(series) {
		return Promise.map(series, function(series) {
			return cd.getVolumes(series)
			.then(_.curryRight(_.get, 2)('volumes'))
			.catch(console.error.bind(console, 'Error: ', series))
		}, {concurrency: 5})
		.then(_.flatten)
		.then(_.filter)
	})
	.then(function(volumes) {
		var bulk = db.collection('volumes').initializeUnorderedBulkOp()
		volumes.forEach(function(volume) {
			bulk.find({volume_id: volume.volume_id}).upsert().updateOne(volume)
		})
		return Promise.fromNode(bulk.execute.bind(bulk))
	})
	.then(showResult)
	.catch(error)
}

function upsertChapters(db, cd) {
	var bar

	return db
	.collection('series')
	.find({}, {series_id: 1})
	.toArrayAsync()
	.then(function(series) {
		bar = new ProgressBar('chapters [:bar] :percent :etas', {
			complete: '=',
			incomplete: ' ',
			width: 20,
			total: series.length
		})
		return series
	})
	.then(function(series) {
		return Promise.map(series, function(series) {
			return cd.getChapters(series)
			.then(_.curryRight(_.get, 2)('chapters'))
			.catch(Function.prototype)
			.finally(bar.tick.bind(bar, 1))
		}, {concurrency: 25})
		.then(_.flatten)
	})
	.then(function(chapters) {
		var bulk = db.collection('chapters').initializeUnorderedBulkOp()
		chapters.forEach(function(chapter) {
			bulk.find({chapter_id: chapter.chapter_id}).upsert().updateOne(chapter)
		})
		return Promise.fromNode(bulk.execute.bind(bulk))
	})
	.then(showResult)
	.catch(error)
}

function upsertPages(db, cd) {
	var bar

	return db
	.collection('chapters')
	.find({}, {chapter_id: 1})
	.toArrayAsync()
	.then(function(chapters) {
		bar = new ProgressBar('pages [:bar] :percent :etas', {
			complete: '=',
			incomplete: ' ',
			width: 20,
			total: chapters.length
		})
		return chapters
	})
	.then(_.curryRight(_.chunk, 2)(25))
	.map(function(chapters) {
		return Promise.map(chapters, function(chapter) {
			return cd.getChapter(chapter)
			.then(_.curryRight(_.get, 2)('pages'))
			.catch(Function.prototype)
			.finally(bar.tick.bind(bar, 1))
			.then(_.filter)
		})
		.then(_.flatten)
		.then(function(pages) {
			if (!pages.length) {
				return Promise.resolve(emptyResult)
			}
			var bulk = db.collection('pages').initializeUnorderedBulkOp()
			pages.forEach(function(page) {
				bulk.find({page_id: page.page_id}).upsert().updateOne(page)
			})
			return Promise.fromNode(bulk.execute.bind(bulk))
		})
	}, {concurrency: 1})
	.reduce(function(acc, result) {
		return {
			nInserted: acc.nInserted + result.nInserted,
			nUpserted: acc.nUpserted + result.nUpserted,
			nMatched: acc.nMatched + result.nMatched,
			nModified: acc.nModified + result.nModified
		}
	}, emptyResult)
	.then(showResult)
	.catch(error)
}

function dumpAll(options) {
	var url = options.url || 'mongodb://localhost:27017/crunchydump'
	var cd = new Client(options)

	return MongoDB
	.connectAsync(url)
	.then(function(db) {
		process.on('SIGINT', function() {
			db.close()
		})
		return Promise.all([
			db,
			cd.login(options.user, options.password),
			db.collection('series').createIndexAsync({series_id: 1}, {unique: true}),
			db.collection('chapters').createIndexAsync({chapter_id: 1}, {unique: true}),
			db.collection('volumes').createIndexAsync({volume_id: 1}, {unique: true}),
			db.collection('pages').createIndexAsync({page_id: 1}, {unique: true}),
		])
	})
	.spread(function(db) {
		return Promise.each([
			upsertSeries,
			upsertVolumes,
			upsertChapters,
			upsertPages
		], function(fn) {
			return fn(db, cd)
		})
		.finally(function() {
			console.log('closed')
			db.close()
		})
	})
	.catch(error)
}

module.exports.upsertSeries = upsertSeries
module.exports.upsertVolumes = upsertVolumes
module.exports.upsertChapters = upsertChapters
module.exports.upsertPages = upsertPages
module.exports.dumpAll = dumpAll