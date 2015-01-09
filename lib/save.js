var Promise = require('bluebird')
var archiver = require('archiver')
var fs = require('fs')
var _ = require('lodash-node')
var name = require('./name')

function saveChapter (to, chapter, pageBuffers) {
	var archive = archiver('zip')
	var file = fs.createWriteStream(to + ".zip")

	archive.pipe(file)
	_.zip(chapter.pages, pageBuffers)
	.forEach(function (page, i, pages) {
		archive.append(page[1], {
			name: name.pageFile(page[0], pages)
		})
	})
	archive.finalize()
	return Promise.resolve(chapter)
}

module.exports.chapter = saveChapter