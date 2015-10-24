var _ = require('lodash-node')
var Promise = require('bluebird')
var request = require('request-promise')
var ProgressBar = require('progress')
var name = require('./name')
var save = require('./save')

function decodeImage (imageBuffer) {
	for (var i = 0; i < imageBuffer.length; i++) {
		imageBuffer[i] ^= 0x42
	}
	return imageBuffer
}

function downloadImage (imageURL) {
	return request
	.get({
		url: imageURL,
		encoding: null
	})
	.then(function (res) {
		return decodeImage(res)
	})
}

function downloadPage (page) {
	var imageURL

	try {
		imageURL = page.locale.enUS.encrypted_composed_image_url
		if (!imageURL) throw new Error()
	} catch (e) {
		console.log("Missing locale:", page)
		imageURL = page.image_url
	}

	return downloadImage(imageURL)
	.catch(function(err) {
		console.error("Failed to download a page: ", page)
		console.error("Error:", err.response)
	})
}

function downloadChapter (chapter) {
	return Promise.map(chapter.pages, downloadPage, 5)
}

function byChapterID (chapterID) {
	return function (chapter) {
		return chapter.chapter_id === chapterID
	}
}

function byChapterNumber (chapterNumber) {
	return function (chapter) {
		return name.chapterNumber(chapter) === chapterNumber
	}
}

function lastChapter () {
	return function (chapter, i, chapters) {
		return i === chapters.length - 1
	}
}

function findChapter (predicate, series, chapters, client) {
	var chapter = chapters.chapters.filter(predicate).pop()
	if (!chapter) throw "Can't find matching chapter"
	console.log("Downloading chapter %s (%s)", name.chapterNumber(chapter), chapter.chapter_id)
	return Promise.join(series, client.listChapter({chapter_id: chapter.chapter_id}))
}

function downloadDefault (series, client, options) {
	return Promise.join(series, client.getChapters(series[0]))
	.spread(function (series, chapters) {
		if (options.chapterID) {
			return findChapter(byChapterID(options.chapterID), series, chapters, client)
		} else
		if (options.chapterNumber) {
			return findChapter(byChapterNumber(options.chapterNumber), series, chapters, client)
		} else {
			return findChapter(lastChapter(options.chapterID), series, chapters, client)
		}
	})
	.spread(function (series, chapter) {
		return Promise.join(series, chapter, downloadChapter(chapter))
	})
	.spread(function (series, chapter, pageBuffers) {
		var fileName = name.chapterFile(series, chapter)
		return Promise.join(fileName, save.chapter(process.cwd() + "/" + fileName, chapter, pageBuffers))
	})
	.spread(function (fileName) {
		console.log("Chapter saved to: %s", fileName)
	})
	.catch(function (err) {
		console.error(err)
	})
}

function downloadSeries (series, client) {
	return Promise.props({
		series: client.getSeries(series),
		chapters: client.getChapters(series).then(_.curryRight(_.get, 2)('chapters'))
	})
	.then(function(data) {
		return Promise.props({
			series: data.series,
			chapters: Promise.map(data.chapters, function(chapter) {
				return client.listChapter({chapter_id: chapter.chapter_id})
				.then(function(pages) {
					return {
						chapter: chapter,
						pages: pages.pages
					}
				})
				.catch(function(error) {
					console.error('%s: %s', error.message, chapter.number)
				})
			}, 1).then(_.filter)
		})
	})
	.then(function(data) {
		var progress = new ProgressBar('chapters [:bar] :percent :etas', {
			complete: '=',
			incomplete: ' ',
			width: 20,
			total: data.chapters.length
		})
		return Promise.each(data.chapters, function(chapter) {
			return downloadChapter(chapter)
			.then(function(pageBuffers) {
				var fileName = name.chapterFile(data.series, chapter)
				return Promise.join(fileName, save.chapter(process.cwd() + "/" + fileName, chapter, pageBuffers))
			})
			.finally(progress.tick.bind(progress, 1))
		}, 1)
		.finally(function() {
			if (!data.chapters.length) {
				console.log('No chapters downloaded. Maybe you should try premium access.')
			} else {
				var numbers = _.pluck(data.chapters, 'chapter.number').join(', ')
				console.log('Chapters downloaded: %s', numbers)
			}
		})
	})
	.catch(function(err) {
		console.log(err)
	})
}

module.exports.image = downloadImage
module.exports.page = downloadPage
module.exports.chapter = downloadChapter
module.exports.series = downloadSeries
module.exports.default = downloadDefault