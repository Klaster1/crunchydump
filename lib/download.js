var Promise = require('bluebird')
var request = require('request-promise')

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
	} catch (e) {
		console.log("Missing locale:", page)
		imageURL = page.image_url
	}

	return downloadImage(imageURL)
}

function downloadChapter (chapter) {
	return Promise.map(chapter.pages, downloadPage, 5)
}

module.exports.image = downloadImage
module.exports.page = downloadPage
module.exports.chapter = downloadChapter