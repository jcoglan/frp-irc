SHELL := /bin/bash
PATH  := node_modules/.bin:$(PATH)

run: compile
	node main.js

compile: *.coffee
	coffee -c $^
