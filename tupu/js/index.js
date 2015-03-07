(function($){

    //获取dom
    var viewport = document.getElementById('viewport');
    var mainContainer = document.getElementById('mainContainer');
    var canvas = document.getElementById('canvas');
    var enterSelect = document.getElementById('enterSelect');
    var selectConfirm = document.getElementById('selectConfirm');
    var selectCancel = document.getElementById('selectCancel');
    var sideBarBtn = document.getElementById('sideBarBtn');
    var sideBarContent = document.getElementById('sideBarContent');
    var save = document.getElementById('save');

    //设置宽高
    var clientWidth = document.documentElement.clientWidth;
    var clientHeight = document.documentElement.clientHeight;
    viewport.style.width = clientWidth;
    viewport.style.height = clientHeight;
    canvas.width = clientWidth;
    canvas.height = clientHeight - 52;
    var viewHeight;

    //获取数据
    var restaurant_url = 'data/restaurant.json';
    var food_url = 'data/food.json';
    var relation_url = 'data/relation.json';

    var msg = {};
    $.when(
       $.ajax({
            url : restaurant_url,
            success : function(restaurant) {
                msg.restaurants = restaurant;
            }
        }),
        $.ajax({
            url : food_url,
            success : function(food) {
                msg.foods = food;
            }
        }),
        $.ajax({
            url : relation_url,
            success : function(relation) {
                msg.relations = relation;
            }
        })
    )
    .fail(function() {
        alert('出错啦~~');
    })
    .done(function() {
        $('.gray-layer').css({'display' : 'none'});
        $('.loading').css({'display' : 'none'});
        if(canvas.getContext){
            window.onresize = function() {
                viewHeight = document.body.clientHeight;
            }
            window.onresize();
            var tupu = new Tupu(msg);
            tupu.redraw();
        }
    });

    //
    var Tupu = function(msg) {

        this.restaurantWidth = 150;
        this.restaurantHeight = 75;
        this.foodRadius = 40;
        this.globalStatus = 1;  //1代表展示模式，0代表布局模式,2代表选择模式
        this.restaurants = [];  //
        this.foods = [];
        this.relations = [];
        this.context = canvas.getContext('2d');
        this.init(msg);

    }

    Tupu.prototype = {

        init : function(msg) {

            var self = this;

            self.restaurants = msg.restaurants;
            self.foods = msg.foods;
            self.relations = JSON.parse(JSON.stringify(msg.relations));

            self.bindRelation();

            self.trackTransforms(self.context);
            self.context.scale(0.75,0.75);

            self.bindEvent();
            
        },

        //将relation的restaurant和food指向相应的实体
        bindRelation : function() {
            var self = this;
            var i,j ;
            var relations = self.relations,
                restaurants = self.restaurants,
                foods = self.foods;
            var relationsLen = relations.length,
                restsLen = restaurants.length,
                foodsLen = foods.length;

            for(i = 0; i < relationsLen; i++) {
                var relation = relations[i];
                for(j = 0; j < restsLen; j++) {
                    var restaurant = restaurants[j];
                    if(restaurants[j].id == relation.restId) {
                        relations[i].restaurant = restaurants[j];       
                    }
                }
                for(var j = 0; j < foodsLen; j++) {
                    if (foods[j].id == relation.foodId) {
                        relations[i].food = foods[j];
                    }
                }
            }
        },

        //控制浮层开关
        sideBarCtrl : {
            turnOn : function(){
                $("#sideBar").animate({
                    left : '0'
                },500,function(){
                    sideBarBtn.innerHTML = '隐藏&lt;';
                });
            },
            turnOff : function() {
                $("#sideBar").animate({
                    left : '-270'
                },500,function(){
                    sideBarBtn.innerHTML = '显示&gt;';
                });
            }
        },

        bindEvent : function() {
            var self = this;
            var context = self.context;
            var relations = self.relations,
                restaurants = self.restaurants,
                foods = self.foods;
            var relationsLen = relations.length,
                restsLen = restaurants.length,
                foodsLen = foods.length;

            //浮层开关控制
            sideBarBtn.addEventListener('click',function(){
                var sideBar = document.getElementById('sideBar');
                if ((sideBar.offsetLeft == -270)) {
                    self.sideBarCtrl.turnOn();
                } else {
                    self.sideBarCtrl.turnOff();
                }
            });

            //浮层滚动
            sideBar.addEventListener('mousewheel',function(e){
                e.preventDefault();
                var dY = 0;
                var lastTop = Number((sideBarContent.style.top || '0px').replace('px',''));
                if(e.wheelDelta > 0){
                    dY += 20;
                } else {
                    dY -= 20;
                }
                var newTop = lastTop + dY;
                var maxTop = 0;
                var minTop = viewHeight - 52 - sideBarContent.clientHeight;
                minTop = (minTop < 0) ? minTop : 0;

                if(newTop > maxTop) {
                    sideBarContent.style.top = 0;
                } else if(newTop < minTop){
                    sideBarContent.style.top = minTop + 'px';
                } else {
                    sideBarContent.style.top = newTop + 'px';
                }
            });

            //进入选择模式
             enterSelect.addEventListener('click',function(){
                self.globalStatus = 2;
                $('.nomal-mode').css({'display':'none'});
                $('.select-mode').css({'display':'block'});
                for(i = 0; i < restsLen; i++){
                    restaurants[i].isSpecial = 0;
                }
                for(i = 0; i < foodsLen; i++){
                    foods[i].isSpecial = 0;
                }
                for(i = 0; i < relationsLen; i++){
                    relations[i].isSpecial = 0;
                }
                self.redraw();
            });

             //选择模式-确定
            selectConfirm.addEventListener('click',function(){

                var bestRes = self.getBestRes();
                var bestResLen = bestRes.length;
                var i;

                for(i = 0; i < restsLen; i++) {
                    restaurants[i].showflag = 0;
                    if(restaurants[i].isSpecial == 2) {
                        restaurants[i].isSpecial = 1;
                    }
                }
                for(i = 0; i < foodsLen; i++) {
                    if(foods[i].isSpecial == 2) {
                        foods[i].isSpecial = 1;
                    }
                }                              
                for(i = 0; i < relationsLen; i++) {
                    if(relations[i].isSpecial == 2) {
                        relations[i].isSpecial = 0;
                    }
                }
                for(i = 0; i < bestResLen; i++){
                    bestRes[i].isSpecial = 1;
                    bestRes[i].showflag = i + 1;
                }

                self.fillSideBarRestsRank(bestRes);
                self.redraw();
            });

            //选择模式-取消
            selectCancel.addEventListener('click',function(){
                self.globalStatus = 1;
                $('.nomal-mode').css({'display':'block'});
                $('.select-mode').css({'display':'none'});
                self.sideBarCtrl.turnOff();

                var i,len;
                for(i = 0; i < restsLen; i++){
                    restaurants[i].isSpecial = 1;
                    restaurants[i].chosenCount = 0;
                    restaurants[i].showflag = 0;
                }
                for(i = 0; i < foodsLen; i++){
                    foods[i].isSpecial = 1;
                }
                for(i = 0; i < relationsLen; i++){
                    relations[i].isSpecial = 0;
                }
                self.redraw();
            });

            var dragStart,
                dragged,
                zoomScale = 0; //缩放等级
            //
            canvas.addEventListener('mousedown',function(evt){
                document.body.style.mozUserSelect = document.body.style.webkitUserSelect = document.body.style.userSelect = 'none';
                lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
                lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
                dragStart = context.transformedPoint(lastX,lastY);
                dragged = false;
            },false);
            
            //
            canvas.addEventListener('mousemove',function(evt){
                lastX = evt.offsetX || (evt.pageX - canvas.offsetLeft);
                lastY = evt.offsetY || (evt.pageY - canvas.offsetTop);
                var pt = context.transformedPoint(lastX,lastY);
                dragged = true;
                if (dragStart){
                    self.drawImage(restaurants[0],1);
                    if(self.globalStatus == 0){ 
                        var obj = self.getNode(pt);
                        if(obj) {
                            obj.data.position = [pt.x,pt.y];
                            self.redraw();
                        }
                    } else {
                        context.translate(pt.x-dragStart.x,pt.y-dragStart.y);
                        self.redraw();
                    }
                }

                //检测鼠标当前所在实体
                var mouseOnObj = self.getNode(pt);
                if(mouseOnObj) {
                    mainContainer.style.cursor = 'pointer';
                   // drawBorder(mouseOnObj.data,mouseOnObj.type);
                } else {
                    mainContainer.style.cursor = 'auto';
                }
            },false);
            
            canvas.addEventListener('mouseup',function(evt){
                dragStart = null;
                //if (!dragged) zoom(evt.shiftKey ? -1 : 1 );
            },false);
            
            canvas.addEventListener('mousewheel',function(e){
                e.preventDefault();
                var clientX = e.offsetX,
                    clientY = e.offsetY;
                var pt = context.transformedPoint(clientX,clientY);
                context.translate(pt.x,pt.y);
                
                if(e.wheelDelta > 0){
                    if(zoomScale < 2 ) {
                        context.scale(1.25,1.25);
                        zoomScale ++;
                    }
                }else {
                    if(zoomScale > -2) {
                        context.scale(0.8,0.8);
                        zoomScale --;
                    }
                }
                context.translate(-pt.x,-pt.y);
                self.redraw();
            });

            canvas.addEventListener('click',function(e){
                var x = e.offsetX;
                    y = e.offsetY;
                var pt = context.transformedPoint(x,y);
                var i,j;
                var obj = self.getNode(pt);
                //设为初始值
                if(self.globalStatus == 1) {
                    if(obj){
                        for(i = 0; i < restsLen; i++) {
                            restaurants[i].isSpecial = 1;
                        }
                        for(i = 0; i < foodsLen; i++) {
                            foods[i].isSpecial = 1;
                        }
                        for(i = 0; i < relationsLen; i++) {
                            relations[i].isSpecial = 0;
                        }
                        obj.data.isSpecial = 2;
                        if(obj.type == 1) {
                            for(j = 0;j < relationsLen; j++){
                                if(relations[j].restId == obj.data.id) {
                                    relations[j].isSpecial = 2;
                                    relations[j].food.isSpecial = 2;
                                    self.clickNode(relations[j],1);
                                }
                            }
                            self.fillSideBarSingleRest(obj.data);
                            self.sideBarCtrl.turnOn();
                        } else {
                            for(var j = 0; j < relationsLen; j++){
                                if(relations[j].foodId == obj.data.id) {
                                    relations[j].isSpecial = 2;
                                    relations[j].restaurant.isSpecial = 2;
                                    self.clickNode(relations[j],2);
                                }
                            }
                            self.fillSideBarFood(obj.data);
                            self.sideBarCtrl.turnOn();
                        }
                    }
                } else if(self.globalStatus == 2) {
                    if(obj) {
                        if(obj.type == 2) {
                            obj.data.isSpecial = (obj.data.isSpecial ? 0 : 1);
                            self.fillSideBarFood(obj.data);
                            self.sideBarCtrl.turnOn();
                        } else {
                            //将isSpecial 为 2 的改为 1
                            for(i = 0; i < restsLen; i++) {
                                if(restaurants[i].isSpecial == 2) {
                                    restaurants[i].isSpecial = 1;
                                }
                            }
                            for(i = 0; i < foodsLen; i++) {
                                if(foods[i].isSpecial == 2) {
                                    foods[i].isSpecial = 1;
                                }
                            }
                            for(i = 0; i < relationsLen; i++) {
                                if(relations[i].isSpecial == 2) {
                                    relations[i].isSpecial = 0;
                                }
                            }

                            //将被点击的餐厅及其拥有的选中的食物及其连线变红
                            if(obj.data.isSpecial == 1) {
                                obj.data.isSpecial = 2;
                                for(i = 0; i < relationsLen; i++) {
                                    var relation = relations[i];
                                    if(relation.isShowed && relation.restId == obj.data.id) {
                                        if(relation.food.isSpecial) {
                                            relation.food.isSpecial = 2;
                                            relation.isSpecial = 2;
                                        }
                                    }
                                }
                            }
                            
                            self.fillSideBarSingleRest(obj.data);
                            self.sideBarCtrl.turnOn();
                        }
                    }
                } else {

                }
                self.redraw();
                //var kt = context.transformLogicToScreen(pt.x,pt.y);
            });
        },

        //pt为鼠标点击的逻辑坐标，返回被点击的对象及类型
        getNode : function(pt) {
            var self = this;
            var context = self.context;
            var relations = self.relations,
                restaurants = self.restaurants,
                foods = self.foods;
            var relationsLen = relations.length,
                restsLen = restaurants.length,
                foodsLen = foods.length;

            var width = self.restaurantWidth,
                height = self.restaurantHeight,
                radius = self.foodRadius;
            var entitityX,
                entitityY;
            var obj = null;

            var i,j;
            //
            for(i = 0; i < restsLen; i++){
                if(restaurants[i].isShowed){
                    entitityX = restaurants[i].position[0];
                    entitityY = restaurants[i].position[1];
                    if((pt.x > entitityX - width/2 + 4) && (pt.x < entitityX + width/2 - 4) && (pt.y > entitityY - height/2 + 4) && (pt.y < entitityY + height/2 -4)){
                        obj = {
                            type : 1,
                            data : restaurants[i]
                        }
                        return obj;
                    }
                }
            }

            for(i = 0; i < foodsLen; i++){
                if(foods[i].isShowed){
                    entitityX = foods[i].position[0];
                    entitityY = foods[i].position[1];
                    if((pt.x - entitityX)*(pt.x - entitityX) + (pt.y - entitityY)*(pt.y - entitityY) <= (radius - 3)*(radius - 3)){
                        obj = {
                            type : 2,
                            data : foods[i]
                        }
                        return obj;
                    }
                }
            }
            return obj;
        },

        //产生小气球标志
        createFlag : function(restaurant) {
            var self = this,
                context = this.context;
            var insertHTML = '<span>' + restaurant.showflag + '</span>';
            var div = document.createElement('div');
            div.className = 'flag';
            div.id = 'flag' + restaurant.id;
            div.innerHTML = insertHTML;             
            var screenPoint = context.transformLogicToScreen(restaurant.position[0],restaurant.position[1]);
            div.style.top = screenPoint.y - 40;
            div.style.left = screenPoint.x - 20;
            $('#flagContainer').append(div);
        },

        //
        clickNode : function(relation,type) {
            var self = this;
            if(!relation.isShowed) {
                //找出relation的另一个实体
                if (type == 1) {
                    //找到position
                    if(!relation.food.position) {
                        var centerPoint = relation.restaurant.position;
                        relation.food.position = [
                            centerPoint[0] + (Math.random() * 200 - 100),
                            centerPoint[1] + (Math.random() * 200 - 100)
                        ]
                    }
                    self.drawLineAnimate(relation.restaurant.position,relation.food.position,function(){
                        self.drawImage(relation.food,2);
                        relation.isShowed = 1;
                        relation.food.isShowed = 1;
                    });
                } else {
                    if(!relation.restaurant.position) {
                        var centerPoint = relation.food.position;
                        relation.restaurant.position = [
                            centerPoint[0] + (Math.random() * 200 - 100),
                            centerPoint[1] + (Math.random() * 200 - 100)
                        ]
                    }
                    self.drawLineAnimate(relation.food.position,relation.restaurant.position,function(){
                        self.drawImage(relation.restaurant,1);
                        relation.isShowed = 1;
                        relation.restaurant.isShowed = 1;
                    });
                }
            } else {
                //所以连线置灰
                relation.isSpecial = 2;
                relation.restaurant.isSpecial = 2;
                relation.food.isSpecial = 2;
                self.redraw();
                //与被点击物体相关的连线变亮
            }
        },

        //计算出最符合的商家
        getBestRes : function() {
            var self = this;
            var chosenFoods = [];
            var bestRes = [];
            var fronts = [];
            var bestResLen;
            var relations = self.relations,
                restaurants = self.restaurants,
                foods = self.foods;
            var relationsLen = relations.length,
                restsLen = restaurants.length,
                foodsLen = foods.length;

            var i,j,k,chosenFoodsLen;

            //将状态清零
            for(i = 0; i < restsLen; i++) {
                restaurants[i].isSpecial = 0;
                restaurants[i].chosenCount = 0;
                restaurants[i].chosenFoods = [];
            }                    
            for(i = 0; i < foodsLen; i++) {
                var food = foods[i];
                if(food.isSpecial) {
                    for(j = 0; j < relationsLen; j++){
                        var relation = relations[j];
                        if(relation.foodId == food.id && relation.restaurant.isShowed){
                            relation.restaurant.chosenCount++;
                            relation.restaurant.chosenFoods.push(food);
                        }
                    }
                }
            }

            //获取所有选中商家
            for(i = 0; i < restsLen; i++) {
                if(restaurants[i].chosenCount) {
                    bestRes.push(restaurants[i]);
                }
            }

            //获取前三名商家
            bestResLen = bestRes.length;
            for(i = 0; i < bestResLen - 1; i++) {
                for(j = bestResLen - 2; j >= i; j--) {
                    if(bestRes[j].chosenCount < bestRes[j+1].chosenCount) {
                        var t = bestRes[j];
                        bestRes[j] = bestRes[j+1];
                        bestRes[j+1] = t;
                    }
                }
            }
            for(i = 0; i < bestResLen; i++) {
                if(i > 2 && bestRes[i].chosenCount != bestRes[i-1].chosenCount) {
                    break;
                } 
                fronts.push(bestRes[i]);
            }    
            return fronts;
        },

        //浮层填充餐厅信息
        fillSideBarSingleRest : function(restaurant) {
            var i,len;
            var cuisineHTML = '',
                commentHTML = '',
                insertHTML = '';

            for(i = 0,len = restaurant.commendFood.length; i < len; i++) {
                cuisineHTML += '<a class="cuisine" href="' + restaurant.commendFood[i].baike + '" target="_blank">' + restaurant.commendFood[i].foodName + '</a>';
            }
            for(i = 0,len = restaurant.reviews.length; i < len; i++){
                commentHTML += '<p class="comment">' + restaurant.reviews[i].comment + '</p>';
            }

            insertHTML = 
                '<div class="restaurant">' +
                    '<div class="baseInfo-wrapper">' +
                        '<h4><a href="' + restaurant.url + '" target="_blank">' +
                            restaurant.shop_name +
                        '</a></h4>' +
                        '<div class="container">' +
                            '<p class="address">' +
                                '地址：' + restaurant.address +
                            '</p>' +
                            '<p class="telephone">' +
                            '电话：' + restaurant.tel +
                            '</p>' +
                            '<div class="others">' +
                                '<div class="line">' +
                                    '<div class="average">' +
                                        '人均：' + restaurant.per_money +
                                    '</div>' +
                                    '<div class="taste">' +
                                        '口味：' + restaurant.taste_score +
                                    '</div>' +
                                '</div>' +
                                '<div class="line">' +
                                    '<div class="environment">' +
                                        '环境：' + restaurant.env_score +
                                    '</div>' +
                                    '<div class="service">' +
                                        '服务：' + restaurant.service_score +
                                    '</div>' +
                                '</div>' +
                                '<div class="line score-star" style="background-position-y:' + Math.ceil(restaurant.star/10.0-5)*19 + 'px">' +
                                '<span>评分：</span>' +
                            '</div>' +
                            '</div>' +
                            '<p>该商家拥有 <em>' + restaurant.tuan.length + '</em> 个团购活动</p>' +
                        '</div>' +
                    '</div>'+
                    '<div class="cuisine-wrapper">' +
                        '<h5>特色菜</h5>' +
                        '<div class="container">' +
                        cuisineHTML +
                        '</div>' +
                    '</div>' +
                    '<div class="comment-wrapper">' +
                        '<h5>点评</h5>' +
                        '<div class="container">' +
                        commentHTML +
                        '</div>' +
                    '</div>' +
                    '</div>';

            $('#sideBar .container').html(insertHTML);
        },

        //浮层填充食物
        fillSideBarFood : function(food) {
            var insertHTML = 
                '<div class="food">' +
                    '<div class="baseInfo-wrapper">' +
                        '<h4><a href="'+ food.url + '" target="_blank">' + food.name + '</a></h4>' +
                        '<div class="container img-container">' +
                            '<a href="' + food.url + '" target="_blank"><img src="' + food.img + '"></a>' +
                        '</div>' +
                    '</div>' +
                    '<div class="cuisine-wrapper">' +
                        '<h5>基本信息</h5>' +
                        '<div class="container">' +
                            '<p>' +
                            food.info + 
                            '</p>' +
                        '</div>' +
                    '</div>' +
                '</div>' ;
            $('#sideBar .container').html(insertHTML);
        },

        //浮层填充餐厅排名
        fillSideBarRestsRank : function(fronts) {
            var cuisineHTML = '',
                resHTML = '',
                insertHTML = '';

            var i,j;
            var front;
            var chosenFoodsLen;
            var chosenFood;

            for(i = 0,len = fronts.length; i < len; i++) {
                front = fronts[i];
                cuisineHTML = '';
                chosenFoodsLen = front.chosenFoods.length;
                for(j = 0; j < chosenFoodsLen; j++) {
                    chosenFood = front.chosenFoods[j];
                    cuisineHTML += '<a class="cuisine" href="' + chosenFood.url + '" target="_blank">' + chosenFood.name + '</a>';
                }
                resHTML +=
                '<div class="res">' +
                    '<h4><span>' + (i+1) + '</span><a href="' + front.url + '" target="_blank">' + front.shop_name +'</a></h4>' +
                    '<div class="cuisine-wrapper">' +
                        '<p>拥有 <em>' + chosenFoodsLen + '</em> 道您选中的菜品</p>' +
                        '<div class="container">' +
                            cuisineHTML +
                        '</div>' +
                    '</div>' +
                    '<div class="others">' +
                        '<div class="line">' +
                            '<div class="average">' +
                                '<span class="title">人均：</span>' +
                                '<span class="value">' + front.per_money + '</span>' +
                            '</div>' +
                            '<div class="taste">' +
                                '<span class="title">口味：</span>' +
                                '<span class="value">' + front.taste_score + '</span>' +
                            '</div>' +
                        '</div>' +
                        '<div class="line">' +
                            '<div class="environment">' +
                                '<span class="title">环境：</span>' +
                                '<span class="value">' + front.env_score + '</span>' +
                            '</div>' +
                            '<div class="service">' +
                                '<span class="title">服务：</span>' +
                                '<span class="value">' + front.service_score + '</span>' +
                            '</div>' +
                        '</div>' +
                        '<div class="line score-star" style="background-position-y:' + Math.ceil(front.star/10.0-5)*19 + 'px">' +
                            '<span>评分：</span>' +
                        '</div>' +
                    '</div>' +
                    '<p>该商家拥有 <em>' + front.tuan.length + '</em> 个团购活动</p>' +
                    '<a class="detail-btn" href="' + front.url + '" target="_blank">查看详情</a>' +
                '</div>';
            }

            insertHTML =
                '<div class="resRank">' + 
                    resHTML +
                '</div>';

            $('#sideBar .container').html(insertHTML);
        },

        //直接画线
        drawLine : function(relation) {
            var self = this;
            var context = self.context;
            var origin = relation.restaurant.position,
                 destination = relation.food.position;
            var ox = origin[0],
                oy = origin[1],
                dx = destination[0],
                dy = destination[1];

            if (relation.isSpecial == 1) {
                context.strokeStyle = "#FF9900";
            } else if(relation.isSpecial == 2){
                context.strokeStyle = "#FD5151";
            } else {
                context.strokeStyle = "#CCC";
            }

            context.beginPath();
            context.moveTo(ox,oy);
            context.lineTo(dx,dy);
            context.stroke();
        },

        //动态画线
        drawLineAnimate : function(origin,destination,cb) {
            var self = this;
            var context = self.context;
            var x = origin[0];
            var y = origin[1];
            var lastX = x;
            var lastY = y;
            var speedx = 0;
            var speedy = 0;
            var speedTime = 10;
            var pt;
            var draw = function() {
                pt = {
                    x : x ,
                    y : y 
                }
                var obj = self.getNode(pt);
                if(!(obj && obj.data.isShowed)){
                    context.beginPath();
                    context.strokeStyle = "#FD5151";
                    context.moveTo(lastX,lastY);
                    context.lineTo(x,y);                        
                    context.stroke();
                } else {
                    var hah;
                }
                lastX = x;
                lastY = y;                                
                speedx = (destination[0] - origin[0])/100;
                speedy = (destination[1] - origin[1])/100;
                var t;
                if((destination[0] - x) * speedx >= 0 && (destination[1] - y) * speedy >= 0 ){
                    x += speedx;
                    y += speedy;
                    t = setTimeout(arguments.callee,speedTime);
                } else {
                    clearTimeout(t);
                    cb && cb();
                }
            }
            draw();
        },

        //type 1 代表 restaurant；2 代表 food
        drawImage : function(obj,type){
            var self = this;
            var context = self.context;
            var width = self.restaurantWidth,
                height = self.restaurantHeight,
                radius = self.foodRadius;
            var imgObj = new Object();
            imgObj.img = new Image();

            if(type == 1){
                if(obj.isSpecial == 1){
                    imgObj.img.src = 'img/rbg.png';
                } else if(obj.isSpecial == 2) {
                    imgObj.img.src = 'img/redrbg.png';
                } else {
                    imgObj.img.src = 'img/grayrbg.png';
                }
                imgObj.img.onload = function(){
                    context.drawImage(imgObj.img, obj.position[0] - width / 2, obj.position[1] - height / 2, width, height);
                    context.font = '14pt Arial';
                    context.fillStyle = '#fff';
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    var name = obj.shop_name;
                    if(name.length <= 7) {
                        context.fillText(name,obj.position[0],obj.position[1]);
                    } else {
                        var name1 = name.slice(0,6);
                        var name2 = name.slice(6)
                        context.fillText(name1,obj.position[0],obj.position[1] - 12);
                        context.fillText(name2,obj.position[0],obj.position[1] + 12);
                    }                        
                } 
            } else {

                if(obj.isSpecial == 1){
                    imgObj.img.src = 'img/fbg.png';
                } else if(obj.isSpecial == 2) {
                    imgObj.img.src = 'img/redfbg.png';
                } else {
                    imgObj.img.src = 'img/grayfbg.png';
                }

                imgObj.img.onload = function(){
                    context.drawImage(imgObj.img,obj.position[0]-radius,obj.position[1]-radius,radius*2,radius*2);
                    context.font='14pt Arial';
                    context.fillStyle = '#fff';
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    var name = obj.name;
                    var name1,name2;
                    if(name.length <4) {
                        context.fillText(name,obj.position[0],obj.position[1]);
                    } else if(name.length == 4) {
                        name1 = name.slice(0,2);
                        name2 = name.slice(2);
                        context.fillText(name1,obj.position[0],obj.position[1] - 10);
                        context.fillText(name2,obj.position[0],obj.position[1] + 12);
                    } else {
                        name1 = name.slice(0,3);
                        name2 = name.slice(3);
                        context.fillText(name1,obj.position[0],obj.position[1] - 10);
                        context.fillText(name2,obj.position[0],obj.position[1] + 12);
                    }                                               
                }
            }

            obj.isShowed = 1;
        },

        //重绘
        redraw : function() {
            var self = this;
            var context = self.context;
            var relations = self.relations,
                restaurants = self.restaurants,
                foods = self.foods;
            var relationsLen = relations.length,
                restsLen = restaurants.length,
                foodsLen = foods.length;
            var width = self.restaurantWidth,
                height = self.restaurantHeight,
                radius = self.foodRadius;
            var i;

            //清除所有画布
            var p1 = context.transformedPoint(0,0),
                p2 = context.transformedPoint(canvas.width,canvas.height);
            context.clearRect(p1.x,p1.y,p2.x-p1.x,p2.y-p1.y);
            $('#flagContainer').empty();

            for(i = 0; i < relationsLen; i++) {
                if(relations[i].isShowed) {
                    self.drawLine(relations[i]);
                    self.drawImage(relations[i].restaurant,1);
                    self.drawImage(relations[i].food,2);
                }
            }
            for(i = 0; i < restsLen; i++) {
                if(restaurants[i].showflag) {
                    self.createFlag(restaurants[i]);
                }
            }
        },

        //http://phrogz.net/tmp/canvas_zoom_to_cursor.html
        trackTransforms : function (ctx) {
            var svg = document.createElementNS("http://www.w3.org/2000/svg",'svg');
            var xform = svg.createSVGMatrix();
            ctx.getTransform = function(){ return xform; };                
            var savedTransforms = [];
            var save = ctx.save;
            ctx.save = function(){
                savedTransforms.push(xform.translate(0,0));
                return save.call(ctx);
            };
            var restore = ctx.restore;
            ctx.restore = function(){
                xform = savedTransforms.pop();
                return restore.call(ctx);
            };        
            var scale = ctx.scale;
            ctx.scale = function(sx,sy){
                xform = xform.scaleNonUniform(sx,sy);
                return scale.call(ctx,sx,sy);
            };
            var rotate = ctx.rotate;
            ctx.rotate = function(radians){
                xform = xform.rotate(radians*180/Math.PI);
                return rotate.call(ctx,radians);
            };
            var translate = ctx.translate;
            ctx.translate = function(dx,dy){
                xform = xform.translate(dx,dy);
                return translate.call(ctx,dx,dy);
            };
            var transform = ctx.transform;
            ctx.transform = function(a,b,c,d,e,f){
                var m2 = svg.createSVGMatrix();
                m2.a=a; m2.b=b; m2.c=c; m2.d=d; m2.e=e; m2.f=f;
                xform = xform.multiply(m2);
                return transform.call(ctx,a,b,c,d,e,f);
            };
            var setTransform = ctx.setTransform;
            ctx.setTransform = function(a,b,c,d,e,f){
                xform.a = a;
                xform.b = b;
                xform.c = c;
                xform.d = d;
                xform.e = e;
                xform.f = f;
                return setTransform.call(ctx,a,b,c,d,e,f);
            };
            var pt  = svg.createSVGPoint();
            ctx.transformedPoint = function(x,y){
                pt.x=x; pt.y=y;
                return pt.matrixTransform(xform.inverse());
            }        
            ctx.transformLogicToScreen = function(x,y)
            {
                pt.x=x; pt.y=y;
                return pt.matrixTransform(xform);
            }
        }
    };

})(jQuery);