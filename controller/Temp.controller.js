sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageToast"
], function(Controller, MessageToast) {
	"use strict";

	return Controller.extend("com.wuerth.itensis.spotifyStatics.controller.Temp", {

		//oSong : {},
		/*
		* Event Handlers
		*/
		onInit: function () {
			// init function
			console.log('hello');
			this.chosenTimeRange = "medium_term" //Default Time-Range
			this.limit = 100;
			this.lastFunc
			this.lastRan
		},
		onAfterRendering: function () {
			// Deinen code habe ich in die Funktion "fnLoadData" ganz unten verschoben, diese wird ausgeführt wenn du auf den "Daten Laden" Knopf drückst (nach dem anmelden)

			// Check if there is a valid access token in local storage. If there is, show the user as logged in.
			var accessToken = localStorage.getItem("accessToken");
			if(accessToken) {
				this.byId("idLoginButton").setBusy(true);
				this._getUserInformation(accessToken).done((response) => {
					// the access token is still valid, show the user as logged in.
					MessageToast.show("Welcome back "+response.id+"!\nYou have been automatically logged in to spotify.", {duration: 5000});
					this._fnLoadData()
					this._fnLoadGenre()
					this.byId("idLoginButton").setVisible(false);
					this.byId("idUserButton").setVisible(true);
					this.getView().setModel(new sap.ui.model.json.JSONModel(response), "userModel");
					this.getView().setModel(new sap.ui.model.json.JSONModel({}), "playModel");
					this.getView().setModel(new sap.ui.model.json.JSONModel({}), "albumModel");
					this.getView().setModel(new sap.ui.model.json.JSONModel({}), "rArtistModel");
					this.getView().setModel(new sap.ui.model.json.JSONModel({}), "suggestionModel");
					this.getView().setModel(new sap.ui.model.json.JSONModel({}), "timeModel");
					this._fnLoadPlaybackInformations();
					this.async();
				}).fail((error) => {
					// the access token is not valid anymore, the user has to login again.
					MessageToast.show("Your session has expired, please log in again.", {duration: 5000});
					console.log(error)
				}).always(() => {
					this.byId("idLoginButton").setBusy(false);
				});
			}
		},
		onPressTopTracks: function (oEvent) {
			console.log(oEvent)
			var oSongId = oEvent.getParameter("listItem").sId
			oSongId.split("-")
			var aSongArray = oSongId.split("-")
			var id = aSongArray[aSongArray.length - 1]
			console.log(id)
			var oTrackModel = this.getView().getModel("trackModel");
			console.log(oTrackModel)
			var oPosition = oTrackModel.getProperty("/"+id+"/track_number")
			var sPosition = oPosition - 1
			var albumUri = oTrackModel.getProperty("/"+id+"/album/uri")
			console.log(albumUri)
			let oSongContext =  {
				"context_uri": albumUri,
				"offset": {
					"position": sPosition
				}
			}
			var myAccessToken = localStorage.getItem("accessToken");
			this._playTrack(oSongContext, myAccessToken)
		},
		onPressTopArtist: function (oEvent) {
			console.log(oEvent)
			var oSongId = oEvent.getParameter("listItem").sId
			oSongId.split("-")
			var aSongArray = oSongId.split("-")
			var id = aSongArray[aSongArray.length - 1]
			console.log(id)
			var oGenreModel = this.getView().getModel("genreModel");
			console.log(oGenreModel)
			var artistId = oGenreModel.getProperty("/"+id+"/uri")
			var artistArray = artistId.split(":")
			var id = artistArray[artistArray.length - 1]
			console.log(id)
			var myAccessToken = localStorage.getItem("accessToken");
			this.playRandomArtistSong(myAccessToken, id)
		},
		onPressList: function (oEvent) {
			console.log(oEvent)
			console.log(oEvent.getParameter("listItem").sId)
			var oSongId = oEvent.getParameter("listItem").sId
			oSongId.split("-")
			var aSongArray = oSongId.split("-")
			var id = aSongArray[aSongArray.length - 1]
			console.log(id)
			var oPlayModel = this.getView().getModel("playModel");
			console.log(oPlayModel)
			var albumUri = oPlayModel.getProperty("/item/album/uri")
			console.log(albumUri)
			let oSongContext =  {
				"context_uri": albumUri,
				"offset": {
					"position": id
				}
			}
			var myAccessToken = localStorage.getItem("accessToken");
			this._playTrack(oSongContext, myAccessToken)
		},
		onCollapseExpandPress: function () {
			var oNavigationList = this.getView().byId('navigationList');
			var bExpanded = oNavigationList.getExpanded();

			oNavigationList.setExpanded(!bExpanded);
		},
		onPress1Year: function () { //Execute by press 1 Year Button
			this._setTimeRange("long_term")	//Set Time-Range
			this._fnLoadData()   //Load Data new
			this._fnLoadGenre()
			this._fnLoadPlaybackInformations()
		},
		onPress6Months: function () { //Execute by press 6 Months Button
			this._setTimeRange("medium_term") //Set Time-Range
			this._fnLoadData() //Load Data new
			this._fnLoadGenre()
			this._fnLoadPlaybackInformations()
		},
		onPress4Weeks: function () { //Execute by press 4 Weeks Button
			this._setTimeRange("short_term")  //Set Time-Range
			this._fnLoadData() //Load Data new
			this._fnLoadGenre()
			this._fnLoadPlaybackInformations()
		},
		onPressGenre: function () { //Execute by press Genre Button
			this.byId("donutChartArtist").setVisible(false); //Artist Donut Chart not visible
			this._diagramGenres(); //Load Genre Chart Data
			this.byId("donutChartGenre").setVisible(true) //Genre DOunt Chart visible
			this._fnLoadPlaybackInformations()
		},
		onPressArtist: function () { //Execute by press Artist Button
			this.byId("donutChartArtist").setVisible(true); //Artist Donut Chart visible
			this._diagrammInformations(); //Load Artist Chart Data
			this.byId("donutChartGenre").setVisible(false) //Genre Donut Chart not visible
			this._fnLoadPlaybackInformations()
		},
		randomGenreSong: async function (oEvent) { //This function takes a random genre song
			var that = this
			var oSegment = oEvent.getParameter("segment");
			oSegment.setSelected(false)
			var sGenreName = oSegment.getLabel();
			console.log(sGenreName)
			var oGenreModel = this.getView().getModel("genreCountsModel");
			var aGenreCounts = oGenreModel.getProperty("/");
			console.log(aGenreCounts)
			var oSelectedGenre = aGenreCounts.find(function (oGenre) {
				return oGenre.name === sGenreName
			});
			console.log(oSelectedGenre)
			var RandomZahl = this._randomNumber(oSelectedGenre.count)
			console.log(RandomZahl)
			var randomArtist = oSelectedGenre.artists[RandomZahl]
			console.log(randomArtist)
			var myAccessToken = localStorage.getItem("accessToken");
			this.playRandomArtistSong(myAccessToken, randomArtist.id)
			console.log(randomArtist.id)
		},
		onPressRelatedArtist: function (oEvent) {
			console.log(oEvent)
			console.log(oEvent.getParameter("listItem").sId)
			var oSongId = oEvent.getParameter("listItem").sId
			oSongId.split("-")
			var aSongArray = oSongId.split("-")
			var id = aSongArray[aSongArray.length - 1]
			console.log(id)
			var oArtistModel = this.getView().getModel("rArtistModel");
			var oArtistId = oArtistModel.getProperty("/"+id+"/uri")
			oArtistId.split(":")
			var aArtistArray = oArtistId.split(":")
			var artistId = aArtistArray[aArtistArray.length - 1]
			console.log(artistId)
			var myAccessToken = localStorage.getItem("accessToken");
			this.playRandomArtistSong(myAccessToken, artistId)
			},
		playRandomArtistSong: function (accessToken, artistId) {
			var that = this
			this._getTopArtistSong(artistId, accessToken).then(function(response) {
				console.log(response)
				var aTopTracks = response.tracks
				var RandomZahl = that._randomNumber(aTopTracks.length)
				var oRandomTrack = aTopTracks[RandomZahl]
				console.log(oRandomTrack)
				let oTrackContext = {
					"context_uri": oRandomTrack.album.uri,
					"offset": {
						"position": oRandomTrack.track_number -1
					}
				}
				that._playTrack(oTrackContext, accessToken).then(function (response) {
					console.log(response)
				})
			})
		},
		simpleSlider: function () {
			var oSlider1 = new sap.ui.commons.Slider({
				id : 'Slider1',
				tooltip: 'Slider1',
				width: '400px'
			});
		},
		onPressPlay: function () { //start song Lil Peep - Avoid
			this._resumePlayback();
			this.byId("idPause").setVisible(true);
			this.byId("idPlay").setVisible(false);
		},
		randomArtistSong: function (oEvent) {
			var that = this;
			var oSegment = oEvent.getParameter("segment");
			oSegment.setSelected(false)
			var sArtistName = oSegment.getLabel();
			console.log(sArtistName)
			var oArtistsModel = this.getView().getModel("artistModel");
			var aArtistCounts = oArtistsModel.getProperty("/");
			console.log(aArtistCounts)
			var oSelectedArtist = aArtistCounts.find(function (oArtist) {
				return oArtist.name === sArtistName
			});
			console.log(oSelectedArtist)
			var RandomZahl = this._randomNumber(oSelectedArtist.count)
			console.log(RandomZahl)
			var randomTrack = oSelectedArtist.tracks[RandomZahl]
			console.log(randomTrack)
			var myAccessToken = localStorage.getItem("accessToken");
			this._playTrack(randomTrack, myAccessToken).then(function (response) {
				console.log(response)
			})
		},
		async: async function () {
			var that = this
			setInterval(function () {
				that._fnLoadPlaybackInformations();
				that.millisToMinutesAndSeconds();
			}, 1000);
		},
		onPressBack: async function () {
			await this._fnLoadPlaybackInformations()
			var oPlayModel = this.getView().getModel("playModel");
			console.log(oPlayModel)
			var iTrackNumber = oPlayModel.getProperty("/item/track_number");
			var iPlaybackTime = oPlayModel.getProperty("/progress_ms");
			console.log(iTrackNumber)
			console.log(iPlaybackTime)
			if (iPlaybackTime < 4000)
			{
				if (iTrackNumber === 1){
					console.log("first track in album, play from start")
					this._playFromStart()
				}
				else {
					console.log("play previous track")
					this._test();
				}
			}
			else{
				console.log("play from start")
				this._playFromStart()
			}
		},
		onPressNext: function () {
			this._playNextSong();
		},
		onFetchAlbumInfo: function() {
			var myAccessToken = localStorage.getItem("accessToken");
			var oPlayModel = this.getView().getModel("playModel");
			var oAlbumModel = this.getView().getModel("albumModel");
			console.log(oPlayModel)
			var sId = oPlayModel.getProperty("/item/album/id")
			console.log(sId)
			var that = this;
			this._getAlbumInformations(myAccessToken, sId).done(function (response) {
				console.log(response)
				var albumInfo = {
					"album_type": response.album_type,
					"name": response.name,
					"artistname": response.artists["0"].name,
					"tracks": response.tracks.items,
				}
				console.log(albumInfo)
				oAlbumModel.setProperty("/",albumInfo)
				console.log(oAlbumModel)

				var trackNumber = oPlayModel.getProperty("/item/track_number")
				console.log(trackNumber);
				var oAlbumList = that.byId("album");
				console.log("oAlbumList")
				console.log(oAlbumList)
				var aItems = oAlbumList.mAggregations.items;

				for (var i = 0; i < aItems.length; i++){
					aItems[i].setHighlight("None")
				}

				aItems[trackNumber-1].setHighlight("Success");


				that._fnloadRelatedArtists()
			})
		},
		onPauseTrack: function () { //pause track
			var myAccessToken = localStorage.getItem("accessToken");
			this.byId("idPause").setVisible(false);
			this.byId("idPlay").setVisible(true);
			this._pauseTrack(myAccessToken);
		},
		/*playTopArtistTrack: function (oArtistContext, accessToken) {
			return $.ajax({
				url: 'https://api.spotify.com/v1/artists/{id}/top-tracks',
				headers: {
					'Authorization': 'Bearer ' + accessToken
				},
				type: 'PUT',
				contentType: "application/json",
				data:
			});
		},*/
		onProgressChange: function (oEvent) {
			var that = this;
			var value = oEvent.getParameter("value");
			var oPlayModel = this.getView().getModel("playModel");
			var sDuration = oPlayModel.getProperty("/item/duration_ms")
			var progress_msNotRound = sDuration / 100 * value
			var progress_ms = Math.round(progress_msNotRound)
			this._setTime(progress_ms)
		},

		onVolumeChange: function (oEvent) {
			var that = this;
			var value = oEvent.getParameter("value");
			console.log(value)

			if (!that.lastRan) {
				that._setVolume(value);
				that.lastRan = Date.now()
			} else {
				clearTimeout(that.lastFunc)
				that.lastFunc = setTimeout(function() {
					if ((Date.now() - that.lastRan) >= that.limit) {
						console.log(value)
						that._setVolume(value);
						that.lastRan = Date.now()
					}
				}, that.limit - (Date.now() - that.lastRan))
			}
		},
		_login: function(callback) {
			var urlPage = window.location.href; //get url
			console.log(urlPage);
			var CLIENT_ID = '3903c98fdc5b4a1890e7302ed81e56dd';
			var REDIRECT_URI = urlPage+'loginProxy.html';
			function getLoginURL(scopes) {
				return 'https://accounts.spotify.com/authorize?client_id=' + CLIENT_ID +
					'&redirect_uri=' + encodeURIComponent(REDIRECT_URI) +
					'&scope=' + encodeURIComponent(scopes.join(' ')) +
					'&response_type=token';
			}

			var url = getLoginURL([
				'playlist-read-private', 'playlist-read-collaborative', 'playlist-modify-public',
				'playlist-modify-private', 'streaming', 'ugc-image-upload', 'user-follow-modify',
				'user-follow-read', 'user-library-read', 'user-library-modify', 'user-read-private',
				'user-read-birthdate', 'user-read-email', 'user-top-read', 'user-read-playback-state',
				'user-modify-playback-state', 'user-read-currently-playing', 'user-read-recently-played'
			]);

			var width = 450,
				height = 730,
				left = (screen.width / 2) - (width / 2),
				top = (screen.height / 2) - (height / 2);

			window.addEventListener("message", function(event) {
				var hash = JSON.parse(event.data);
				if (hash.type === 'access_token') {
					callback(hash.access_token);
				}
			}, false);

			window.open(url,
				'Spotify',
				'menubar=no,location=no,resizable=no,scrollbars=no,status=no, width=' + width + ', height=' + height + ', top=' + top + ', left=' + left
			);
			this._reload()
			},
		/**
		 * Fetches user information from the spotify api.
		 *
		 * @param {string} accessToken The current user's access token
		 * @returns {*} promise The promise for response data.
		 */
		fnHandleLoginPress: function () {
			this._login((accessToken) => {
				localStorage.setItem("accessToken", accessToken);
				this._getUserInformation(accessToken).then((response) => {
					this.byId("idLoginButton").setVisible(false);
					this.byId("idUserButton").setVisible(true);

					this._fnLoadData()
					this._fnLoadGenre()
					this.getView().setModel(new sap.ui.model.json.JSONModel(response), "userModel");
					this.getView().setModel(new sap.ui.model.json.JSONModel({}), "playModel");
					this.getView().setModel(new sap.ui.model.json.JSONModel({}), "albumModel");
					this.getView().setModel(new sap.ui.model.json.JSONModel({}), "rArtistModel");
					this.getView().setModel(new sap.ui.model.json.JSONModel({}), "suggestionModel");
					this.getView().setModel(new sap.ui.model.json.JSONModel({}), "timeModel");
					this._fnLoadPlaybackInformations()
				});
			});
		},
		fnHandleSearch: function (oEvent) {
			var oSearchControl = oEvent.getSource();
			var sQuery = oEvent.getParameter("query");
			var oSuggestionItem = oEvent.getParameter("suggestionItem");
			var search = sQuery.split(" ").join("+")
			var oSuggestionModel = this.getView().getModel("suggestionModel")
			console.log(search)

			if (sQuery.length === 0) {
				// do nothing
			} else if (oSuggestionItem) {
				var test = oSuggestionItem.oBindingContexts.suggestionModel.sPath
				var item = oSuggestionModel.getProperty(test)
				console.log(test)
				console.log(item)

			} else {
				oSearchControl.setBusy(true);
				var myAccessToken = localStorage.getItem("accessToken")
				this._getSearch(myAccessToken, search).then(function (response) {
					console.log(response)
					var aSearchResults = response.artists.items.concat(response.tracks.items)
					console.log(aSearchResults)
					oSuggestionModel.setProperty("/", aSearchResults);
					oSearchControl.suggest(true);
					oSearchControl.setBusy(false);
				})
			}


		},
		/*
		* End of Event Handlers
		*/


		/*
		* API Calls
		*/
		_getSearch: function (accessToken, searchInfo) {
			return $.ajax({
				url: 'https://api.spotify.com/v1/search?q='+searchInfo+'&type=track%2Cartist&limit=10',
				headers: {
					'Authorization': 'Bearer ' + accessToken
				},
				type: 'GET',
				dataType: "json",
				contentType: "application/json"
			});
		},
		_getTopArtistSong: function (AritstId, accessToken) { //get top 50 artist songs
			return $.ajax({
				url: 'https://api.spotify.com/v1/artists/' + AritstId + '/top-tracks?country=CH',
				headers: {
					'Authorization': 'Bearer ' + accessToken
				}
			});
		},
		_getTop50: function(accessToken, timeRange) { //get the top 50 tracks from user
			return $.ajax({
				url: 'https://api.spotify.com/v1/me/top/tracks?time_range='+this.chosenTimeRange+'&limit=50',
				headers: {
					'Authorization': 'Bearer ' + accessToken
				}
			});
		},
		_getGenre: function(accessToken, timeRange) { //get all genres form user
			return $.ajax({
				url: 'https://api.spotify.com/v1/me/top/artists?time_range='+this.chosenTimeRange+'&limit=50',
				headers: {
					'Authorization': 'Bearer ' + accessToken
				}
			});
		},
		_setTime: function (progress_ms) {
			var myAccessToken = localStorage.getItem("accessToken");
			return $.ajax({
				url: 'https://api.spotify.com/v1/me/player/seek?position_ms='+progress_ms,
				headers: {
					'Authorization': 'Bearer ' + myAccessToken
				},
				type: 'PUT',
				dataType: "json",
				contentType: "application/json"
			});
		},
		_setVolume: function (value) {
			console.log('send volume')
			var myAccessToken = localStorage.getItem("accessToken");
			return $.ajax({
				url: 'https://api.spotify.com/v1/me/player/volume?volume_percent='+value,
				headers: {
					'Authorization': 'Bearer ' + myAccessToken
				},
				type: 'PUT',
				dataType: "json",
				contentType: "application/json"
			});

		},
		_getRealtedArtists: function (aArtistId) {
			var myAccessToken = localStorage.getItem("accessToken")
			return $.ajax({
				url: 'https://api.spotify.com/v1/artists/'+aArtistId+'/related-artists',
				headers: {
					'Authorization': 'Bearer ' + myAccessToken
				},
				type: 'GET',
				dataType: "json",
				contentType: "application/json"
			});
		},
		_resumePlayback: function (accessToken) {
			var myAccessToken = localStorage.getItem("accessToken");
			return $.ajax({
				url: 'https://api.spotify.com/v1/me/player/play',
				headers: {
					'Authorization': 'Bearer ' + myAccessToken
				},
				type: 'PUT',
				dataType: "json",
				contentType: "application/json"
			});
		},
		_test: function () {
			var myAccessToken = localStorage.getItem("accessToken");
			return $.ajax({
				url: 'https://api.spotify.com/v1/me/player/previous',
				headers: {
					'Authorization': 'Bearer ' + myAccessToken
				},
				type: 'POST',
				dataType: "json",
				contentType: "application/json"
			});
		},
		_playNextSong: function () {
			var that = this;
			var myAccessToken = localStorage.getItem("accessToken");
			return $.ajax({
				url: 'https://api.spotify.com/v1/me/player/next',
				headers: {
					'Authorization': 'Bearer ' + myAccessToken
				},
				type: 'POST',
				dataType: "json",
				contentType: "application/json"
			});
		},

		/*_playPrevious: function (accesToken) {
			this._fnLoadPlaybackInformations()
			var oPlayModel = this.getView().getModel("playModel");
			console.log(oPlayModel)
			var myAccessToken = localStorage.getItem("accessToken");
			var oSongContext = {
				"context_uri": oPlayModel.getProperty("/context/uri"),
				"offset": {
					"position": oPlayModel.getProperty("/item/track_number") -1
				}
			}
			console.log(oSongContext);
			return $.ajax({
				url: 'https://api.spotify.com/v1/me/player/previous',
				headers: {
					'Authorization': 'Bearer ' + accesToken
				},
				type: 'POST',
				dataType: "json",
				contentType: "application/json",
			});
		},*/
		_playFromStart: async function () {
			await this._fnLoadPlaybackInformations();
			var oPlayModel = this.getView().getModel("playModel");
			console.log(oPlayModel)
			var sUri = oPlayModel.getProperty("/item/uri");
			var oSongContext = "";
			if (sUri.includes("track")) {
				console.log("track uri")
				console.log(sUri)
				oSongContext = {
					"context_uri": oPlayModel.getProperty("/item/album/uri"),
					"offset": {
						"position": oPlayModel.getProperty("/item/track_number") - 1
					}
				}
			} else {
				oSongContext = {
					"context_uri": sUri,
					"offset": {
						"position": oPlayModel.getProperty("/item/track_number") - 1
					}
				}
			}
			if (this.byId("idPlay").getVisible() === true) {
				this.byId("idPlay").setVisible(false);
				this.byId("idPause").setVisible(true);
			}
			var myAccessToken = localStorage.getItem("accessToken");
			console.log(oSongContext);
			return $.ajax({
				url: 'https://api.spotify.com/v1/me/player/play',
				headers: {
					'Authorization': 'Bearer ' + myAccessToken
				},
				type: 'PUT',
				dataType: "json",
				contentType: "application/json",
				data: JSON.stringify(oSongContext)
			});
		},
		_getAlbumInformations: function (accessToken, sId) {
			return $.ajax({
				url: 'https://api.spotify.com/v1/albums/'+sId,
				headers: {
					'Authorization': 'Bearer ' + accessToken
				},
				type: 'GET',
				dataType: "json",
				contentType: "application/json",
			});
		},
		_getPlayback: function (accessToken) {
			return $.ajax({
				url: 'https://api.spotify.com/v1/me/player',
				headers: {
					'Authorization': 'Bearer ' + accessToken
				},
				type: 'GET',
				dataType: "json",
				contentType: "application/json",
			});
		},
		_playTrack: function (oSongContext, accessToken,) {
			return $.ajax({
				url: 'https://api.spotify.com/v1/me/player/play',
				headers: {
					'Authorization': 'Bearer ' + accessToken
				},
				type: 'PUT',
				dataType: "json",
				contentType: "application/json",
				data: JSON.stringify(oSongContext)
			});
			this._getAlbumInformations();
		},
		_pauseTrack: function (accessToken) {
			return $.ajax({
				url: 'https://api.spotify.com/v1/me/player/pause',
				headers: {
					'Authorization': 'Bearer ' + accessToken
				},
				type: 'PUT',
			});
		},
		_getTempoBackground: function(accessToken, id){
			return $.ajax({
				url: 'https://api.spotify.com/v1/audio-analysis/'+id,
				headers: {
					'Authorization': 'Bearer ' + accessToken
				},
				type: 'GET',
				dataType: "json",
				contentType: "application/json",
			});
		},

		/**
		 * Handles the login to the spotify API. Calls the callback function with the access token.
		 * @param {function} callback
		 */
		_getUserInformation: function(accessToken) {
			return $.ajax({
				url: 'https://api.spotify.com/v1/me',
				headers: {
					'Authorization': 'Bearer ' + accessToken
				},
			});
		},
		millisToMinutesAndSeconds: function() {
			var oPlayModel = this.getView().getModel("playModel");
			var progress_ms = oPlayModel.getProperty("/progress_ms");
			var duration_ms = oPlayModel.getProperty("/item/duration_ms");
			function getStringFromMs (ms) {
				var minutes = Math.floor(ms / 60000 << 0);
				var seconds = ((ms % 60000) / 1000).toFixed(0);
				return minutes + ":" + (seconds < 10 ? '0' : '') + seconds
			}
			var sDuration = getStringFromMs(duration_ms)
			var sProgress = getStringFromMs(progress_ms)
			var oTimeModel = this.getView().getModel("timeModel")
			oTimeModel.setProperty("/progress", sProgress)
			oTimeModel.setProperty("/duration", sDuration)

		},

		/**
		 * Catches the 'press' event of the login button. Calls login function, fetches user information from spotify
		 * and displays the username.
		 */

		/*
		* End of API Calls
		*/


		/*
		* Helper Functions
		*/
		_diagramGenres: function () {
			//Get Diagram Informations
			var oGenreModel = this.getView().getModel("genreModel");
			var aGenre = oGenreModel.getProperty("/");
			console.log(aGenre);
			let aGenreCounts = [];
			for (let iGenre = 0; iGenre < aGenre.length; iGenre++) {
				let oGenre = aGenre[iGenre];
				let name = oGenre.genres[0] ? oGenre.genres[0] : "kein Genre";

				let oArtistContext = {
					"name": oGenre.name,
					"id": oGenre.id
				}

				var iIndexInGenreArray = aGenreCounts.findIndex(function (oGenreCounts) {
					return oGenreCounts.name === name
				});

				if (iIndexInGenreArray !== -1) {
					aGenreCounts[iIndexInGenreArray].count = aGenreCounts[iIndexInGenreArray].count + 1;
					aGenreCounts[iIndexInGenreArray].artists.push(oArtistContext)
				} else {
					aGenreCounts.push({"name": name, "count": 1, "artists": [oArtistContext]})
				}
			}
			console.log(aGenreCounts)
			var oGenreCountsModel = new sap.ui.model.json.JSONModel(aGenreCounts);
			console.log(oGenreCountsModel)
			this.getView().setModel(oGenreCountsModel, "genreCountsModel");
		},
		_diagrammInformations: function () {
			//Get Diagram Informations
			var oTrackModel = this.getView().getModel("trackModel");
			var aTracks = oTrackModel.getProperty("/");

			let aArtistCounts = [];
			for (let iTrack = 0; iTrack < aTracks.length; iTrack++) {
				let oTrack = aTracks[iTrack];
				let name = oTrack.artists[0].name;
				let oTrackContext = {
					"context_uri": oTrack.album.uri,
					"offset": {
						"position": oTrack.track_number -1
					}
				}

				var iIndexInCountsArray = aArtistCounts.findIndex(function (oArtistCounts) {
					return oArtistCounts.name === name
				});

				if (iIndexInCountsArray !== -1) {
					aArtistCounts[iIndexInCountsArray].count = aArtistCounts[iIndexInCountsArray].count + 1;
					aArtistCounts[iIndexInCountsArray].tracks.push(oTrackContext)
				} else {
					aArtistCounts.push({"name": name, "count": 1, "tracks": [oTrackContext]})
				}
			}
			console.log(aArtistCounts)
			var oArtistModel = new sap.ui.model.json.JSONModel(aArtistCounts);
			console.log(oArtistModel)
			this.getView().setModel(oArtistModel, "artistModel");
		},
		_setTimeRange: function (timeRange){
			this.chosenTimeRange = timeRange; 	//set time Range for API
		},
		_randomNumber: function (iMax) {
			return Math.floor(Math.random() * iMax); //random number generator

			/*{
				var context_uri = "spotify:album:{trackModel>"+[Math.floor(Math.random() * 50)]+"album/id}"
				"context_uri": context_uri;
				"offset":
				if ("trackModel>album/album_type" === "SINGLE"){
				"position": 0
			}	else {
					"position": Math.floor(Math.random() * "trackModel>album/track_number" -1)
				}
			}*/
		},
		_fnLoadData: function () {
			var that = this
			this.byId("tracks").setVisible(true);

			// mit localStorage.getItem("accessToken"); kannst du dir überall den token holen, den du für die API Zugriffe brauchst.
			var myAccessToken = localStorage.getItem("accessToken");
			// see https://developer.spotify.com/web-api/get-users-top-artists-and-tracks/
			this._getTop50(myAccessToken, this.chosenTimeRange).then(function(response) {
				console.log(response)
				var oModel = new sap.ui.model.json.JSONModel(response.items);
				that.byId("tracks").setBusy(false);
				that.getView().setModel(oModel, "trackModel");
				console.log(that.getView().getModel("trackModel"));
				/**
				 * Korrekt, du hast drei weitere Buttons erstellt um die Timerange umzuschalten.
				 * Du hast erkannt dass diese buttons solange disabled sein sollen, bis der benutzer angemeldet ist.
				 * Und du hast erkannt in welcher funktion bzw. an welcher stelle im code diese buttons enabled gesetzt werden sollen.
				 */
				that.byId("id4WeekButton1").setEnabled(true);
				that.byId("id1YearButton1").setEnabled(true);
				that.byId("id6MonthsButton1").setEnabled(true);
				that.byId("id4WeekButton").setEnabled(true);
				that.byId("id1YearButton").setEnabled(true);
				that.byId("id6MonthsButton").setEnabled(true);
				that.byId("idArtistsButton").setEnabled(true);
				that.byId("idGenreButton").setEnabled(true);
				that.byId("idPlay").setEnabled(true);
				that.byId("idPause").setEnabled(true);
				that._diagrammInformations();
			});
		},
		_fnLoadPlaybackInformations: function (_reload){
			var that = this
			var myAccessToken = localStorage.getItem("accessToken");
			var oPlayModel = this.getView().getModel("playModel")
			return new Promise(function (resolve) {
				that._getPlayback(myAccessToken).then(function(response) {
					oPlayModel.setProperty("/", response);
				if (response.item.uri !== that.nowPlaying){
					that.nowPlaying = response.item.uri
					that.onFetchAlbumInfo();
					var id = oPlayModel.getProperty("/item/id")
					that._getTempoBackground(myAccessToken, id);
				}
					resolve();
				})
			})
		},
		_fnloadRelatedArtists: function() {
			var myAccessToken = localStorage.getItem("accessToken");
			var that = this
			var oRelatedArtists = this.getView().getModel("rArtistModel")
			console.log("vvv")
			console.log("rArtistModel")
			var oPlayModel = this.getView().getModel("playModel");
			var aArtistId = oPlayModel.getProperty("/item/album/artists/0/id")

			that._getRealtedArtists(aArtistId).then(function (response) {
				console.log("related artists")
				response.artists.map(artist => artist.genres = artist.genres.join(", "))
				var aSortedArtists = response.artists.sort((a, b) => b.popularity - a.popularity)
				oRelatedArtists.setProperty("/", aSortedArtists)
				console.log(oRelatedArtists)
			})
		},
		_fnLoadGenre: function () {
				var that = this
				this.byId("artist").setVisible(true);
				var myAccessToken = localStorage.getItem("accessToken");
				this._getGenre(myAccessToken, this.chosenTimeRange).then(function(response) {
					console.log(response)
					var oGenre = new sap.ui.model.json.JSONModel(response.items);
					that.byId("artist").setBusy(false);
					that.getView().setModel(oGenre, "genreModel");
					console.log(that.getView().getModel("genreModel"));
					that.byId("id4WeekButton").setEnabled(true);
					that.byId("id1YearButton").setEnabled(true);
					that.byId("id6MonthsButton").setEnabled(true);
					that._diagramGenres();
				})},
		});
		/*
		* End of Helper Functions
		*/
});
