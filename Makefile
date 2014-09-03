SHELL := /bin/bash
PATH  := node_modules/.bin:$(PATH)

coffee   = $(wildcard *.coffee)
compiled = $(coffee:%.coffee=%.js)

run: $(compiled)
	node main.js

%.js: %.coffee
	coffee -co $(dir $@) $^
