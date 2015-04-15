# trimming units from 0 in calc property (031)

Chrome does not apply the declaration if `0px` in `calc()` calculations is
minified to `0`. This test case is based off this issue in CSSO:

https://github.com/css/csso/issues/222

Ideally, the superfluous `0` can be trimmed from the property.
