#知识图谱
项目线上地址 [demo](http://182.92.240.92/guijie/) 。<br/>

知识图谱是国内比较新的概念，简单讲就是利用可视化等技术将知识,信息更好地展出来，更多内容请见[知识图谱](http://baike.baidu.com/link?url=jh2aexKunx7bfB3HlSv4LQice0xwFes0Xm-k9CHnsFbcIwwXo3WT1qYC-i-QDKOhtVdr4u261i3Dtj-YXbwHya)。<br/>

这个项目主要是将北京商家及其相关菜品用图谱的形式呈现出，让人直观地看出簋街各个商家及其相关菜品的信息。
项目我负责的是前端。另外数据，UI由另外两个给力的小伙伴负责。<br>

前端技术最关键就是 canvas 。关于 canvas ,这里有一个别人写的 [demo](http://phrogz.net/tmp/canvas_zoom_to_cursor.html)，可以实现拖动，缩放等功能。<br>
canvas 本来是没有事件处理功能，在这里我将 canvas 中的每个小图形模拟成一个 dom。但是这种方法有很大的局限性，当图形形状不规则时就很难应用。
