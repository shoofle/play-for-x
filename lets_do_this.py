import tornado.ioloop
import tornado.web
import tornado.template
import tornado.websocket
from os import listdir
from os.path import join, isfile
import re
import json

path = "/home/shoofle/play-for-x"
loader = tornado.template.Loader(path)
games_subdir = "games"
path_games = join(path, games_subdir)
files = [f for f in listdir(path_games) if isfile(join(path_games, f))]

rooms = dict()

class MainHandler(tornado.web.RequestHandler):
	def get(self, r=None, room=None, n=None, user=None, g=None, game=None):#games=None, room=None, rest=None):
		if r is None: room = ""
		if room not in rooms: rooms[room] = {"": []}
		if n is None: user = ""
		if user not in rooms[room]: rooms[room][user] = []
		if g is None: 
			self.render("index.html", room=room, user=user, games=files)
		else:
			if game not in files: game = "default"
			self.render(join(path_games, game), room=room, user=user)

class SocketHandler(tornado.websocket.WebSocketHandler):
	def open(self, r=None, room=None, n=None, user=None):
		if r is None: room = ""
		if room not in rooms: rooms[room] = {"": []}
		if n is None: user = ""
		if user not in rooms[room]: rooms[room][user] = []
		self.room_name = room
		self.user_name = user
		rooms[self.room_name][self.user_name].append(self)

		starting_message = {"type" : "chat", "player" : self.user_name, "content" : "Connected to server!"}
		self.write_message(json.dumps(starting_message))
		print("Got a new connection!")

	def on_message(self, message):
		print(self.room_name, str(self), " received message ", message)
		try:
			m = json.loads(message)
			m_type = m["type"]
		except ValueError as e:
			response = {"type": "error",
						"content": e}
			print("Error decoding message.")
			self.write_message(json.dumps(response))
			return

		if m_type == "room change":
			oldroom = self.room_name
			newroom = m["room name"]

			rooms[oldroom][self.user_name].remove(self)
			if len(rooms[oldroom][self.user_name]) == 0:
				del rooms[oldroom][self.user_name]
			if len(rooms[oldroom]) == 0:
				del rooms[oldroom]
			if newroom not in rooms:
				rooms[newroom] = {"": []}
			if self.user_name not in rooms[newroom]:
				rooms[newroom][self.user_name] = []
			rooms[newroom][self.user_name].append(self)

			self.room_name = newroom
		if m_type == "name change":
			oldname = self.user_name
			newname = m["user name"]
			
			rooms[self.room_name][oldname].remove(self)
			if len(rooms[self.room_name][oldname]) == 0:
				del rooms[self.room_name][oldname]
			if newname not in rooms[self.room_name]:
				rooms[self.room_name][newname] = []
			rooms[self.room_name][newname].append(self)
			
			self.user_name = newname
			response = {"type": "chat",
						"player": "system",
						"content": oldname + "is now known as " + newname}
			self.write_message(json.dumps(response))

		if m_type == "game request": 
			response = {"type": "game", 
						"url": join(games_subdir, m["game name"]),
						"user": self.user_name,
						"room": self.room_name}
			self.write_message(json.dumps(response))

class GameSocketHandler(tornado.websocket.WebSocketHandler):
	def open(self, r=None, room=None, n=None, user=None):
		if r is None: room = room or ""
		if room not in rooms: rooms[room] = {"" : []}
		self.room_name = room
		
		if n is None: user = user or ""
		self.user_name = user

		print("GSH: Got a connection for ", self.user_name, " in room ", self.room_name)
	def on_message(self, message):
		print("GSH: Got a message: %s" % message)
		try:
			m = json.loads(message)
			#if "type" in m and "game" in m and "score" in m:
			if u"player" not in m: m[u"player"] = self.user_name
			if u"room" not in m: m[u"room"] = self.room_name
		except ValueError as e:
			m = {	"type" : "error", 
					"player" : self.user_name, 
					"room" : self.room_name,
					"value" : "GSH encountered an error parsing."}
		the_room = rooms[self.room_name]
		for name in the_room:
			# Send to everyone connected to a name in the room.
			for sock in the_room[name]:
				sock.write_message(message)
	
#	def on_close(self):
#		print("GSH: Closed connection.")

application = tornado.web.Application([
	(r"(/r/([^/]+))?(/n/([^/]+))?/socket", SocketHandler),
	(r"(/r/([^/]+))?(/n/([^/]+))?/results", GameSocketHandler),
	(r"(/r/([^/]+))?(/n/([^/]+))?(/games/([^/]+))?/?", MainHandler),
])

if __name__ == "__main__":
	application.listen(80)
	tornado.ioloop.IOLoop.instance().start()

