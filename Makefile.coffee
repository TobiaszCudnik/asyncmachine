require 'shelljs/make'

target.build_fix = ->
	sed '-i', /"rsvp"/ig, 'rsvp', 'build/lib/multistatemachine.d.ts'
