var last_evt;
$(document).ready(function () {
	var name_field = $('form#change-name input[type=text]');
	var room_field = $('form#change-room input[type=text]');
	var chat_field = $('form#chat-inputs input[type=text]');
	var room = room_field.val(), name = name_field.val();
	var wsurl = "ws://li60-203.members.linode.com/socket?name=" + encodeURIComponent(name) + "&room=" + encodeURIComponent(room);
	var ws = new WebSocket(wsurl);
	var indicator = $("#indicator");
	var play_area = $("#play-area");
	ws.onopen = function (evt) {
		indicator.removeClass('closed');
		indicator.addClass('open');
		indicator.html("Connection is open!");
	};
	ws.onmessage = function (evt) {
		var data;
		try {
			data = JSON.parse(evt.data);
		}
		catch (error) {
			data = {"type": "error", "content": error, "pay-no-heed": "event logged in last_evt"};
		}
		last_evt = evt;
		console.log(data);

		var log_entry = $();
		if (data.type == "game") {
			var arr = [];
			jQuery.each(data.parameters, function(key, value){arr.push(encodeURIComponent(key)+"="+encodeURIComponent(value));});
			var play_area = $('<iframe></iframe>').addClass('play-area').attr('src', data.url + "?" + arr.join("&"));
			var play_close = $('<button></button>').append('x').addClass('close-button');
			play_close.click(function (evt) { $(evt.target).parents('.play-container').remove(); });
			var play_container = $('<div></div>').addClass('play-container');
			play_container.append(play_area).append(play_close);
			$('#game-area').append(play_container);
			// This doesn't add a log entry.
		}
		else if (data.type == "game result") {
			log_entry = $('<li></li>').addClass('result');
			log_entry.append($('<span></span>').html(data.player).addClass('from player'));
			log_entry.append(" got ");
			log_entry.append($('<span></span>').html(data.score).addClass('score'));
			log_entry.append(" in ");
			log_entry.append($('<span></span>').html(data.game).addClass('game'));
		}
		else if (data.type == "chat") {
			log_entry = $('<li></li>').addClass('chat-message');
			log_entry.append($('<span></span>').html(data.player).addClass('from player'));
			log_entry.append($('<span></span>').html(data.content).addClass('message'));
		}
		else if (data.type == "system message") {
			log_entry = $('<li></li>').html(data.content).addClass('system message');
		}
		else if (data.type == "join") {
			log_entry = $('<li></li>').html(data.player + " has joined " + data.room).addClass('system join');
		}
		else if (data.type == "part") {
			log_entry = $('<li></li>').html(data.player + " has left " + data.room).addClass('system part');
		}
		else if (data.type == "name change") {
			log_entry = $('<li></li>').html(data.old_name + " now known as " + data.new_name).addClass('system namechange');
		}
		else if (data.type == "name list") {
			var names_list = $('#names').html('');
			jQuery.each(data.names, function() { names_list.append($('<li></li>').html(this).addClass('player')); });
			handlers(names_list)
			// This doesn't add a log entry.
		}
		else if (data.type == "error") {
			log_entry = $('<li></li>').addClass('error').html(data.content);
		} 
		else {
			log_entry = $('<li></li>').addClass('noclue').html(evt.data);
		}
		$('#log').prepend(log_entry);
		handlers(log_entry);
	};
	ws.onclose = function(evt) {
		indicator.removeClass('open');
		indicator.addClass('closed');
		indicator.html("Connection is closed.");
	};
	
	$('form#change-name').submit(function () {
		ws.send(JSON.stringify(
				{"type" : "name change", "user name" : name_field.val()}
				));
		return false;
	});
	$('form#change-room').submit(function () {
		ws.send(JSON.stringify(
				{"type" : "room change", "room name" : room_field.val()}
				));
		return false;
	});
	$('form#chat-inputs').submit(function () {
		ws.send(JSON.stringify(
				{"type" : "chat", "content" : chat_field.val()}
				));
		chat_field.val('');
		return false;
	});
	function handlers (element) {
		$(element).find('.player').each(function() {
			this.ondragover = function(evt) { evt.preventDefault(); }
			this.ondrop = function(evt) {
				ws.send(JSON.stringify(
						{"type" : "game request", 
						"game_name" : evt.dataTransfer.getData("Text"), 
						"target" : $(evt.target).html()}
						));
			};
		});
		$(element).find('.game').draggable = true;
		$(element).find('.game').each(function() { 
			this.draggable=true;
			this.ondragstart = function(evt) {
				evt.dataTransfer.setData("Text", $(this).html());
			};
		});
		$(element).find('.game').click(function(evt) {
			ws.send(JSON.stringify(
					{"type" : "game request", 
					"game_name" : $(evt.target).html(),
					"target" : name_field.val()}
					));
		});
	}
	handlers(document);
});
