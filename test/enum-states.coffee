describe 'Enum states', ->
	class Foo extends asyncmachine.AsyncMachine

	id = asyncmachine.IdGenerator
	Foo.states =
		StateOne: id()
		StateTwo: id()
		StateThree: id()