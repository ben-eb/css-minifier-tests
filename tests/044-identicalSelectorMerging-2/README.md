# identical selector merging 2 (044)

For a 'safe', or 'optimal' minification, it is better to collapse selectors
which are next to each other. Re-ordering of selectors may cause breakage;
however, in this example it is safe to do so. The original issue is from the
CSSO tracker:

https://github.com/css/csso/issues/217
