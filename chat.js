var last_evt;
$(document).ready(function () {
	var name = $('form#name [name=name]').val()
	var room = $('form#room [name=room]').val()
	//var wsurl = ("" + window.location).replace(/^http/i, "ws").replace(/\/?(\?.*)?$/, "/socket$1");
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
			console.log(error);
			data = {"type": "error", "content": error};
		}
		last_evt = evt;
		console.log(evt.data);

		var log_entry = $();
		if (data.type == "game") {
			var arr = [];
			jQuery.each(data.parameters, function(key, value){arr.push(encodeURIComponent(key)+"="+encodeURIComponent(value));});
			play_area.attr('src', data.url + "?" + arr.join("&"));
		}
		else if (data.type == "game result") {
			log_entry = $('<li></li>').addClass('result');
			log_entry.append($('<span></span>').html(data.player).addClass('from player'));
			log_entry.append(" got ");
			log_entry.append($('<span></span>').html(data.score).addClass('score'));
			log_entry.append(" in ");
			log_entry.append($('<span></span>').html(data.game).addClass('game'));
			$('#log').append(log_entry);
			handlers(log_entry);
		}
		else if (data.type == "chat") {
			log_entry = $('<li></li>').addClass('chat');
			log_entry.append($('<span></span>').html(data.player).addClass('from player'));
			log_entry.append($('<span></span>').html(data.content).addClass('message'));
			// Want to somehow identify messages from players. Drag-and-drop would be really cool for sending games.
			$('#log').append(log_entry);
			// Add the player click handlers!
			handlers(log_entry)
		}
		else if (data.type == "system message") {
			log_entry = $('<li></li>').html(data.content).addClass('system message');
			$('#log').append(log_entry);
		}
		else if (data.type == "join") {
			log_entry = $('<li></li>').html(data.player + " has joined " + data.room).addClass('system join');
			$('#log').append(log_entry);
		}
		else if (data.type == "part") {
			log_entry = $('<li></li>').html(data.player + " has left " + data.room).addClass('system part');
			$('#log').append(log_entry);
		}
		else if (data.type == "name change") {
			log_entry = $('<li></li>').html(data.old_name + " now known as " + data.new_name).addClass('system namechange');
			$('#log').append(log_entry);
		}
		else if (data.type == "name list") {
			var names_list = $('#names').html('');
			jQuery.each(data.names, function() { names_list.append($('<li></li>').html(this).addClass('player')); });
			// Add the player click handlers
			handlers(names_list)
			//names_list.find('.player').click(player_click);
		}
		else if (data.type == "error") {
			log_entry = $('<li></li>').addClass('error').html(data.content);
			$('#log').append(log_entry);
		} 
		else {
			log_entry = $('<li></li>').addClass('noclue').html(evt.data);
			$('#log').append(log_entry);
		}
		handlers(log_entry);
	};
	ws.onclose = function(evt) {
		indicator.removeClass('open');
		indicator.addClass('closed');
		indicator.html("Connection is closed.");
	};
	
	$("form#name").submit(function () {
		ws.send(JSON.stringify({"type" : "name change", "user name" : $('form#name [name=name]').val()}));
		return false;
	});
	$('form#room').submit(function () {
		ws.send(JSON.stringify({"type" : "room change", "room name" : $('form#room [name=room]').val()}));
		return false;
	});
	$('form#chat').submit(function () {
		ws.send(JSON.stringify({"type" : "chat", "content" : $('form#chat [name=message]').val()}));
		$('form#chat [name=message]').val('');
		return false;
	});
	function handlers (element) {
		$(element).find('.player').each(function() {
			this.ondragover = function(evt) { evt.preventDefault(); }
			this.ondrop = function(evt) {
				ws.send(JSON.stringify({"type" : "game request", "game_name" : evt.dataTransfer.getData("Text"), "target" : $(evt.target).html()}));
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
			ws.send(JSON.stringify({"type" : "game request", "game_name" : $(evt.target).html(), "target" : $('form#name [name=name]').val()}));
		});
	}
	handlers(document);
});
