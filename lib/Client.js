var Promise = require('bluebird')
var request = require('request-promise')
var _ = require('lodash-node')

function APIClient () {
	this.jar = request.jar()
	this.auth = {
		auth: 'null',
		session_id: null
	}
	this.user = null
}

APIClient.prototype.updateSessionID = function updateSessionID () {
	this.auth.session_id = this.jar._jar.store.idx['crunchyroll.com']['/'].sess_id.value
}

APIClient.prototype.callAPI = function callAPI (method, options) {
	return request
	.get({
		url: 'http://api-manga.crunchyroll.com/' + method,
		qs: _.assign({
			version: 0,
			format: 'json'
		}, options || {}, this.auth),
		json: true,
		jar: this.jar
	})
	.then(function (res) {
		return res
	}, function (res) {
		throw res.response.body
	})
}

APIClient.prototype.login = function login (user, password) {
	// Not authorized
	if (!user || !password) {
		return Promise.resolve(this.user)
	}

	// Authorized
	return request
	.post({
		url: 'https://www.crunchyroll.com/',
		qs: {
			a: 'formhandler'
		},
		form: {
			formname: 'RpcApiUser_Login',
			fail_url: 'http://www.crunchyroll.com/login',
			name: user,
			password: password
		},
		jar: this.jar
	})
	.then(function (res) {
		this.updateSessionID()
		return this.user
	}.bind(this), function (res) {
		this.updateSessionID()
		if (res.response.headers.location === '/') {
			return this.callAPI('cr_authenticate')
			.then(function (res) {
				_.assign(this, res.data)
				return this.user
			}.bind(this), function (res) {
				return this.user
			}.bind(this))
		} else {
			console.log("Wrong credentials")
			return this.user
		}
	}.bind(this))
}

APIClient.prototype.getChapter = function getChapter (options) {
	return this.callAPI('chapter', options)
}

APIClient.prototype.getChapters = function getChapters (options) {
	return this.callAPI('chapters', options)
}

APIClient.prototype.getVolumes = function getVolumes (options) {
	return this.callAPI('volumes', options)
}

APIClient.prototype.getSeries = function getSeries (options) {
	return this.callAPI('series', options)
}

APIClient.prototype.getPages = function getPages (options) {
	return this.callAPI('pages', options)
}

module.exports = APIClient