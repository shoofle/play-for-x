play-for-x
==========

A Tornado server using websockets to let a DM give their players minigames to play instead of rolling for skill checks. This is currently running on port 7777. I should learn how to make a good multi-app server or something.

Check out the files in `games` to see some tiny javascript minigames that I made! I like making these little games in js because it becomes so easy to script simple reactive behavior to user input. If you're not trying to make a game with complicated inter-object interactions and physics, then often, solid interface behavior is most of what you need - and if all you need is good interface behavior, why program it yourself when you can just use a browser? Plus, I can draw things with SVG, which has just as much tie-in to user events.

It's just so easy!

If you go to http://li60-203.members.linode.com:7777/games/ you'll see an interface into the games I've written for this, plus the ability to change the configuration. At the moment, this is just by editing JSON as text. In the future, I'd like to have a nicer, compact editor, which could be made compact, hopefully. 
