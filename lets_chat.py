import tornado.ioloop
import tornado.web
import tornado.websocket
from os import listdir
from os.path import join, isfile
import re
import json

#TODO: Would like to change from using the word "socket" on urls to using something else that doesn't imply the technology used. Not sure what to use, though. Not a big concern.

path = "/home/shoofle/play-for-x"
games_subdir = "games"

default_room = "lobby"
default_name = "guest"

path_games = join(path, games_subdir)
files = [f for f in listdir(path_games) if isfile(join(path_games, f))]

rooms = dict()
class Room(object):
	def __init__(self, name):
		self.name = name
		self.sockets = []
	
	def add_socket(self, socket):
		print(str(self) + ": " + str(socket) + " joined me, user name: " + socket.user_name)
		self.sockets.append(socket)
		self.send({"type": "join", "player": socket.user_name, "room": self.name})
		self.send_names()
	
	def remove_socket(self, socket):
		print(str(self) + ": " + str(socket) + " parted me, user name: " + socket.user_name)
		if socket in self.sockets:
			self.sockets.remove(socket)
		self.send({"type": "part", "player": socket.user_name, "room": self.name})
		self.send_names()

	def change_name(self, socket, user_name=None):
		print(str(self) + ": " + str(socket) + " changed name from " + socket.user_name + " to " + user_name)
		self.send({"type": "name change", "old_name": socket.user_name, "new_name": user_name})
		old_name = socket.user_name
		socket.user_name = user_name
		self.send_names()

	def send(self, message, user_name=None):
		if not (isinstance(message, basestring) or isinstance(message, str)):
			message = json.dumps(message)
		for socket in self.sockets:
			if user_name is None or socket.user_name==user_name and socket is not None:
				socket.write_message(message)
	def send_names(self): self.send({"type": "name list", "names": [s.user_name for s in self.sockets]})
	def __contains__(self, socket): return socket in self.sockets	
	def __len__(self): return len(self.sockets)

class MainHandler(tornado.web.RequestHandler):
	def get(self, game=None):
		room_name = self.get_argument("room", "lobby")
		user_name = self.get_argument("name", "guest")
		print("room name: " + room_name + " user name: " + user_name)
		if game is None:
			self.render("chat.html", games=files, room=room_name, user=user_name)
		else:
			print(game)
			game = game.split("/")[1]
			if game not in files: game = "default"
			self.render(join(path_games, game), room=room_name, user=user_name)

class SocketHandler(tornado.websocket.WebSocketHandler):
	def open(self):
		self.room_name = self.get_argument("room", "lobby")
		self.user_name = self.get_argument("name", "guest")
		print("".join(str(self), "socket connected to room: {", self.room_name, "} name: {", self.user_name, "}"))
		
		if self.room_name not in rooms: rooms[self.room_name] = Room(self.room_name)
		self.room = rooms[self.room_name]
		self.room.add_socket(self)
		
	def on_message(self, message):
		print(self, message)
		try:
			m = json.loads(message)
			m_type = m["type"]
		except ValueError as e:
			response = {"type": "error", "content": "error decoding json"}
			self.write_message(json.dumps(response))
			return

		if m_type == "chat":
			self.room.send({"type": "chat", "player": self.user_name, "content": m["content"]})

		if m_type == "room change":
			new_room = m["room name"]

			self.room.remove_socket(self)
			
			if len(rooms[self.room_name]) == 0: del rooms[self.room_name]
			if new_room not in rooms: rooms[new_room] = Room(new_room)
			
			self.room = rooms[new_room]
			self.room_name = self.room.name
			self.room.add_socket(self)
		
		if m_type == "name change":
			self.room.change_name(self, user_name=m["user name"])

		if m_type == "game request":
			print(m)
			player = m["target"]
			params = {"name": player, "room": self.room_name}
			response = {"type": "game", "url": join(games_subdir, m["game_name"]), "parameters": params}
			self.room.send(response, player)
	
	def on_close(self):
		self.room.remove_socket(self)

class GameSocketHandler(tornado.websocket.WebSocketHandler):
	def open(self, r=None, room=None, n=None, user=None):
		self.room_name = self.get_argument("room", "lobby")
		self.user_name = self.get_argument("name", "guest")
		print(str(self) + " opened")
	def on_message(self, message):
		try:
			m = json.loads(message)
		except ValueError as e:
			m = {"type" : "error", "player" : self.user_name, "room" : self.room_name, "content" : "Malformed results!"}
		if self.room_name in rooms:
			rooms[self.room_name].send(m)
	def on_close(self):
		print(str(self) + " closed")

application = tornado.web.Application([
	(r"/(games/[^/]+)?", MainHandler),
	(r"/socket", SocketHandler),
	(r"/results", GameSocketHandler),
], 
static_path="/home/shoofle/play-for-x/",
static_url_prefix="/static/"
debug = True
)

if __name__ == "__main__":
	application.listen(80)
	tornado.ioloop.IOLoop.instance().start()
