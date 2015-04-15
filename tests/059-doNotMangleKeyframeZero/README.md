# do not mangle keyframe 0% (059)

Minifiers should not convert `0%` to `0`. However, `100%` can be safely
converted to `to`.

https://github.com/yui/yuicompressor/issues/151
