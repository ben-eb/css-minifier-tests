# remove invalid charsets 2 (072)

Note that the optimisations that remove the `@charset` altogether in this test
are still correct, as it is an invalid declaration. However, it makes more sense
to move this to the top of the file, rather than removing.
