window.addEventListener("message", event_listener, false);
function badmessage(msg) { console.log("bad message received! ", msg); }
function event_listener (event) {
	if (event.origin != 'http://li60-203.members.linode.com:7777' && event.origin != 'http://li60-203.members.linode.com/') { 
		badmessage(event); 
		return;
	}
	$('#report').append($('<li></li>').html(JSON.stringify(event.data)));
}

	

$(document).ready(function () {
	var game_area = $('#game-area');
	var fetch_button = $('#fetch-button');
	var config_input = $('#controls>textarea');
	var push_button = $('#push-button');

	$('#game-list').children().each(function () {
	$(this).data('url', 'http://li60-203.members.linode.com:7777/games/' + $(this).html());
	}).on('click', function (evt) {
		var url = $(this).data('url');
		game_area.attr('src', url);
		game_area.on('load', function() { fetch_button.click(); });
//		fetch_button.click();
	});

	fetch_button.click(function (event) {
		json_editor.set(JSON.parse(JSON.stringify(frames[0].config)));
	});
	
/*	fetch_button.click(function (event) {
		config_input.val(JSON.stringify(frames[0].config));
		config_input.change();
	});
	config_input.on('keypress keyup change', function (event) {
		try {
			JSON.parse(config_input.val());
			config_input.removeClass('invalid').addClass('valid');
		}
		catch (e) {
			config_input.removeClass('valid').addClass('invalid');
		}

	});
	*/
	push_button.click(function (event) {
//		frames[0].config = JSON.parse(config_input.val());
		frames[0].config = json_editor.get();
		frames[0].game_trash();
		frames[0].game_initialize(frames[0].config);
		frames[0].game_start()
	});

});
