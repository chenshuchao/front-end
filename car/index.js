var car = function (){
    var ctx,W,H,cw,ch,isL,isR,isS,roadLineL,roadLineW,roadLineX,roadLineY,roadLineSpace,roadLinemY,mY,myCar,otherCar,speed,nodeSpeed,LRSpeed;
    nodeSpeed = document.getElementById("speed");

    var init = function(id){
        var obj = document.getElementById(id);
        ctx = obj.getContext('2d');

        W = obj.width || 400 ;  //画布宽度
        H = obj.height || 800 ; //画布高度
        this.timer = null;  //计时器清零
        cw = 20;       //小车宽度
        ch = 30;         //小车长度
        isL = false,    //左移
        isR = false;    //右移
        isS = false;    //加速
        speed = 0;  //小球速度
        LRSpeed = 10;   //左右移动速度
        roadLineL = 60; //路中央标志长度
        roadLineW = 10; //标志宽度
        roadLineX = 145;    //第一块标志X坐标
        roadLineY = 0;
        roadLineSpace = 2*roadLineL;    //标志长度加上标志空闲
        roadLinemY = 10;    //标志每次长度
        mY = 10;    //otherCar 每次移动长度
        myCar = new Image();
        myCar.src = "myCar.png";
        myCarX = 140;
        myCarY = 450;
        otherCar = new Array();
    }

    init.prototype = {
        run : function(){
            var that = this;    
            // clearTimeout(this.timer);
            this.timer = setTimeout(function(){
            //此处是匿名函数，匿名函数里面的this指向window而不是执行函数，所以之前我们暂存了that，指向ini函数
                that.run();     
                that.draw();
            },20);
            this.evListener();
        },
        stop : function(){
            clearTimeout(this.timer);
            this.timer = null;
        },
        clear : function(){
            ctx.clearRect(0,0,W,H);
        },
        draw : function(){
            this.clear();// 清除重绘
            (roadLineY<=roadLineSpace-roadLineL)? roadLineY:(roadLineY-=roadLineSpace);
            this.road(roadLineY);

            if(isS){( speed < 2) && (speed += 0.01);}
            else if(speed > 0) {speed -= 0.05;}
            else {speed = 0;}
            this.speed(speed);
            roadLineY += (roadLinemY*speed);
           
             // myCar偏移
            isL && (myCarX - LRSpeed >= 0) && (myCarX -= LRSpeed);
            isR && (myCarX + LRSpeed <= W - cw) && (myCarX += LRSpeed);
            ctx.drawImage(myCar,myCarX,myCarY);

            //更新一下其他车辆的信息，判断是否冲撞
            this.refreshOtherCar();
        },
        //路的动态效果
        road:function(y){

            this.rect(roadLineX,roadLineY,roadLineW,roadLineL);
            this.rect(roadLineX,roadLineY+roadLineSpace,roadLineW,roadLineL);
            this.rect(roadLineX,roadLineY+2*roadLineSpace,roadLineW,roadLineL);
            this.rect(roadLineX,roadLineY+3*roadLineSpace,roadLineW,roadLineL);
            this.rect(roadLineX,roadLineY+4*roadLineSpace,roadLineW,roadLineL);
            this.rect(roadLineX,roadLineY+5*roadLineSpace,roadLineW,roadLineL);
            this.rect(roadLineX,roadLineY+6*roadLineSpace,roadLineW,roadLineL);
        },
        refreshOtherCar:function(){
            var that = this;
            //随机生成小车，并且随着速度越快生成越多
            if(speed>1 && 0==Math.floor(Math.random()*50*(3-speed))){
                var newOtherCar = new Object();
                newOtherCar.img = new Image();
                newOtherCar.img.src = "otherCar.png";
                newOtherCar.X = Math.floor(Math.random()*280);
                newOtherCar.Y = 0;
                newOtherCar.speed = 1;
                otherCar.push(newOtherCar);
            }
            //更新小车位置并判断是否冲撞
            for (var i = otherCar.length - 1; i >= 0; i--) {
                otherCar[i].Y += mY*(speed-otherCar[i].speed);
                ctx.drawImage(otherCar[i].img,otherCar[i].X,otherCar[i].Y)

                 if (myCarX<otherCar[i].X + cw && myCarX>otherCar[i].X - cw && myCarY<otherCar[i].Y+ch && myCarY>otherCar[i].Y-ch){
                    alert("Game Over!");
                    that.stop();
                 }
            }

         },
        rect : function(x,y,w,h){
            ctx.fillStyle = "#fff";
            ctx.beginPath();
            ctx.rect(x,y,w,h);
            ctx.closePath();
            ctx.fill();
        },
        speed : function(s){
            if(s<2){
                nodeSpeed.innerHTML = speed.toFixed(1);
            }
            else{
                nodeSpeed.innerHTML = "Full Speed!";
            }
        },

        evListener : function(){
            document.addEventListener('keydown',function(e){
                e.keyCode == 65 && (isL = true);
                e.keyCode == 68 && (isR = true);
                e.keyCode == 74 && (isS = true);
            },false);

            document.addEventListener('keyup',function(e){
                e.keyCode == 65 && (isL = false);
                e.keyCode == 68 && (isR = false);
                e.keyCode == 74 && (isS = false);
            },false);
        },
        release : function(){
            document.removeEventListener('keyup',function(){},false);
            document.removeEventListener('keydown',function(){},false);
        }
    }
    return init;
}();

(function(){
    var game = new car('demo'),
        btnStart = document.getElementById("start"),
        btnReset = document.getElementById("reset"),
        flag = true;
    
    btnStart.addEventListener('click',function(e){
        start();
    },false);

    document.addEventListener('keydown',function(e){
        switch(e.keyCode){
            case 32:
                start();
                break;
            case 27:
                reset();
                break;
            default:
                return false;
                break;
        }   
    },false);

    btnReset.addEventListener('click',function(e){
        reset();
    },false);

    function start(){
        flag && game.run();     //启动
        flag =false;
    }
    function reset(){
        flag = true;
        game.stop();
        game.clear();
        game.release();//解除事件绑定
        game = null;
        game = new car('demo');
    }
})();
