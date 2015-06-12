var util = require('util')
var _ = require('lodash-node')
	_.str = require('underscore.string')

function seriesName (series) {
	return series[0].locale.enUS.name.replace(/\s/g, "_").replace(/:/, "_-")
}

function chapterNumber (chapter) {
	return parseInt(chapter.number, 10)
}

function paddedChapterNumber (series, chapter) {
	return _.str.lpad(
		chapterNumber(chapter.chapter),
		series[0].total_chapters.toString().length,
		"0"
	)
}

function chapterFile (series, chapter) {
	return util.format(
		"%s_c%s_[Crunchyroll]",
		seriesName(series),
		paddedChapterNumber(series, chapter)
	)
}

function pageFile (page, pages) {
	return _.str.lpad(page.number, pages.length.toString().length, "0") + ".jpeg"
}

module.exports.seriesName = seriesName
module.exports.chapterNumber = chapterNumber
module.exports.chapterFile = chapterFile
module.exports.pageFile = pageFile