$(document).ready(function(){

});

function req(path, cb){
	path = nano.settings.muzi + path;
	$.ajax({
		url: path,
		type: 'GET',
		success: function(data){
			cb(data); 
		}
	})
}

nano = {};

nano.settings = {
	muzi: 'https://sdslabs.co.in/muzi/ajax/',
	music: 'https://music.sdslabs.co.in/',
	albumPic: function(val){
		return 'https://cdn.sdslabs.co.in/music_pics/' + val + '.jpg';
	},
	shuffle: false,
	repeat: false
}

nano.data = {
	// stores all the playlists
	playlists: {},
	
	// stores selected playlist data
	playlist: {},

	// stores data for current playing song
	current: {},

	// array index of song currently playing
	currentNo: -1,

	// playing == true
	// paused == false
	songState: false,

	// Holds the current playing songs variable
	song: null 
}

nano.muzi = {
	// gets all playlists
	getPlaylists: function(){
		req('user/info.php?userid=me', function(data){
			var list = {};
			for(var i in data.playlists){
				$('.selector ul').append('<li data-pid=' + data.playlists[i].pid + '>' + data.playlists[i].name + '</li>')
			}
			$('.selector ul li').click(function(){
				var id = $(this).attr('data-pid');
				nano.muzi.fetchPlaylist(id);
				$('.container').css('display', 'inline-block');
				$('.selector').hide()
			})
			nano.data.playlists = data;
		});	
	},

	// fetches all songs from particular playlist
	fetchPlaylist: function(id){
		var path = 'playlist/index.php?id='+id;
		req(path, function(data){
			nano.data.playlist = data;
			nano.muzi.playPlaylist();
		});
	},

	playPlaylist: function(){
		if(nano.settings.shuffle){
			var next = Math.floor(Math.random() * nano.data.playlist.tracks.length);
			if(next === nano.data.currentNo){
				nano.muzi.playPlaylist();
				return;
			}
		}
		else{
			var next = -1;
			if(nano.data.currentNo < nano.data.playlist.tracks.length){
				next = ++nano.data.currentNo;
			}
		}
		nano.player.play(nano.data.playlist.tracks[next].id);
	}
}

nano.player = {
	play: function(id){
		path = 'track/index.php?id=' + id;
		req(path, function(data){
			nano.data.current = data;
			
			var file = nano.settings.music + data.file;
			
			if(nano.data.song !== null){
				nano.data.song.unload();
			}

			nano.data.song = new Howl({
		  		urls: [file],
		  		onend: nano.muzi.playPlaylist
			}).play();

			nano.data.songState = true;
			nano.hooks.setSongDetails();
		})
	},

	togglePlay: function(){
		if(nano.data.songState){
			nano.data.songState = false;
			nano.data.song.pause();
			$('.pause-button').html('<img src="./img/play-icon-white.png" style="margin-left: 2px;" alt="">')
		}
		else if(!nano.data.songState){
			nano.data.songState = true;
			nano.data.song.play();
			$('.pause-button').html('<img src="./img/pause-icon-white.png" alt="">')
		}
	},

	next: function(){
		nano.muzi.playPlaylist();
	},

	previous: function(){
		if(nano.data.currentNo !== 0){
			nano.data.currentNo = nano.data.currentNo - 2;
			nano.muzi.playPlaylist();
		}
	}
}

nano.hooks = {
	setSongDetails: function(){
		nano.hooks.setAlbumArt();
		nano.hooks.setArtist();
		nano.hooks.setTitle();
		setInterval(function(){
			nano.hooks.setDuration();	
		} , 1000);
	},

	setAlbumArt: function(){
		var id = nano.data.current.albumId;
		var path = nano.settings.albumPic(id);
		var val = 'url(' + path + ')';
		$('.poster').css('background-image', val);
	},

	setArtist: function(){
		$('.artist').html(nano.data.current.artist);
	},

	setTitle: function(){
		$('.title').html(nano.data.current.title);
	},

	setDuration: function(){
		var dur = (nano.data.song.pos() / nano.data.current.length) * 100;
		if(dur > 100){
			dur = 100;
		}
		$('.progress div').width(dur + '%');
	},

	playerSetup: function(){
		$('.pause-button').click(function(){
			nano.player.togglePlay();
		});
		$('.previous-button').click(function(){
			nano.player.previous();
		});
		$('.next-button').click(function(){
			nano.player.next();
		});
		$('.shuffle-button').click(function(){
			if(!nano.settings.shuffle){
				nano.settings.shuffle = true;
				$(this).addClass('active');
			}
			else if(nano.settings.shuffle){
				nano.settings.shuffle = false;
				$(this).removeClass('active');
			}
		});
	}
}

nano.init = function(){
	nano.muzi.getPlaylists();
	nano.hooks.playerSetup();
}

nano.init();