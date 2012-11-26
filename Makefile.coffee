require 'shelljs/make'

target.build_fix = ->
	sed '-i', /"rsvp"/ig, 'rsvp', 'build/lib/asyncmachine.d.ts'
