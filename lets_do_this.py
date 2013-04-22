import tornado.ioloop
import tornado.web
import tornado.template
import tornado.websocket
import os.path

path = "/home/shoofle/auriga"
loader = tornado.template.Loader(path)
games_subdir = "games"
path_games = os.path.join(path, games_subdir)
files = [f for f in os.listdir(path_games) if os.path.isfile(os.path.join(path_games, f))]

class MainHandler(tornado.web.RequestHandler):
	def get(self):
		self.write(loader.load("index.html").generate())

class GameWebHandler(tornado.web.RequestHandler):
	def get(self, uri):
		self.write(loader.load(os.path.join(path_games, uri)).generate(value="heyo"))

class SocketHandler(tornado.websocket.WebSocketHandler):
	def open(self):
		print("Got a new connection!")
		self.write_message("Connection opened!")

	def on_message(self, message):
		print("Received message %s" % message)
		if message in files:
			self.write_message(os.path.join(games_subdir, message))
		else:
			self.write_message(os.path.join(games_subdir, "default.html"))

	def on_close(self):
		print("Closed a connection.")
	
class GameSocketHandler(tornado.websocket.WebSocketHandler):
	def open(self):
		print("GSH: Got a connection.")
	def on_message(self, message):
		print("GSH: Got a message: %s" % message)
		self.write_message("Good job!")
	def on_close(self):
		print("GSH: Closed connection.")

application = tornado.web.Application([
	(r"/", MainHandler),
	(r"/games/(.*)", GameWebHandler),
	(r"/socket", SocketHandler),
	(r"/game_data", GameSocketHandler),
])

if __name__ == "__main__":
	application.listen(80)
	tornado.ioloop.IOLoop.instance().start()

