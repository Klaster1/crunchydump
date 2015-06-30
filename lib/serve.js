var express = require('express')
var Promise = require('bluebird')
var MongoDB = Promise.promisifyAll(require('mongodb'))
var _ = require('lodash-node')

function error(msg) {
	return {
		error: {
			msg: msg
		}
	}
}

var defaults = {
	url: 'mongodb://localhost:27017/crunchydump',
	port: 3333,
	log: true
}

function runServer(options) {
	options = _.assign({}, defaults, options)

	return MongoDB
	.connectAsync(options.url)
	.then(function(db) {
		var app = express()

		app.get('/series', function(req, res) {
			if (options.log) console.log(req.query)
			db.collection('series')
			.find(req.query.series_id ? {series_id: req.query.series_id} : {})
			.toArrayAsync().then(function(series) {
				res.json(series)
			})
		})
		app.get('/chapters', function(req, res) {
			var series_id = req.query.series_id
			var chapter_id = req.query.chapter_id

			if (!series_id && !chapter_id) {
				return res.status(400).json(error('Missing series'))
			}

			var query = _.assign({series_id: series_id}, chapter_id ? {chapter_id: chapter_id} : {})

			Promise.props({
				series: db.collection('series').find({series_id:series_id}).toArrayAsync(),
				chapters: db.collection('chapters').find(query).toArrayAsync()
			})
			.then(res.json.bind(res))
		})
		app.get('/list_chapter', function(req, res) {
			var chapter_id = req.query.chapter_id

			Promise.props({
				chapter: db.collection('chapters').findOneAsync({chapter_id: chapter_id}),
				pages: db.collection('pages').find({chapter_id: chapter_id}).toArrayAsync()
			})
			.then(res.json.bind(res))
		})

		return {
			express: app.listen(options.port),
			db: db
		}
	})
}

module.exports.runServer = runServer