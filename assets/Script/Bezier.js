

module.exports = {

    Factorial: function (number) {
        let factorial = 1;
        let temp = number;
        for (let i = 0; i < number; ++i) {
            factorial *= temp;
            --temp;
        }
        return factorial;
    },

    Combination: function (count, r) {
        return this.Factorial(count) / (this.Factorial(r) * this.Factorial(count - r));
    },

    CalcDistance: function (x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
    },

    CalcAngle : function(x1,y1,x2,y2){
        return 90-Math.atan2(y2-y1,x2-x1)*180/Math.PI;
    },

    /**
     * 将贝塞尔曲线变成点
     * @param {*贝塞尔控制点X坐标数组} ctrlPosXArry 
     * @param {*贝塞尔控制点Y坐标数组} ctrlPosYArry 
     * @param {*贝塞尔控制点数量,二阶或者三阶} initCount 
     * @param {*存放分割的点} traceVector 
     * @param {*切割曲线的距离 像素} fdistance 
     */
    BuildBezier: function (ctrlPosXArry, ctrlPosYArry, initCount, TraceVector, fdistance) {
        var index = 0;
        var t = 0;
        var count = initCount - 1;
        var tfDis = fdistance;
        var tempValue = 0;
        var tPos = cc.v2(0, 0);

        while (t < 1) {
            tPos = cc.v2(0,0);
            index = 0;
            
            while (index <= count) {
                tempValue = Math.pow(t, index) * Math.pow(1 - t, count - index) * this.Combination(count, index);
                tPos.x+= ctrlPosXArry[index] * tempValue;
                tPos.y+= ctrlPosYArry[index] * tempValue;
                ++index;
            }
            let fSpace = 0;
            if (TraceVector.length > 0) {
                var backPos = TraceVector[TraceVector.length - 1];
                fSpace = this.CalcDistance(backPos.x, backPos.y, tPos.x, tPos.y);
            }
            
            if (fSpace >= tfDis || TraceVector.length == 0) {
                TraceVector.push(tPos);
            }
            t += 0.001;
        };
    },

    /**
     * 将贝塞尔曲线变成点,生成的结果中包含了角度
     * @param {*} ctrlPosXArry 
     * @param {*} ctrlPosYArry 
     * @param {*} initCount 
     * @param {*} TraceVector 
     * @param {*} fdistance 
     */
    BuildBezierWithAngle: function (ctrlPosXArry, ctrlPosYArry, initCount, TraceVector, fdistance) {
        var index = 0;
        var t = 0;
        var count = initCount - 1;
        var tfDis = fdistance;
        var tempValue = 0;
        var tPos = {
            x:0,
            y:0,
            angle :0,
        };

        while (t < 1) {
            tPos = cc.v2(0,0);
            index = 0;
            
            while (index <= count) {
                tempValue = Math.pow(t, index) * Math.pow(1 - t, count - index) * this.Combination(count, index);
                tPos.x+= ctrlPosXArry[index] * tempValue;
                tPos.y+= ctrlPosYArry[index] * tempValue;
                ++index;
            }
            let fSpace = 0;
            if (TraceVector.length > 0) {
                var backPos = TraceVector[TraceVector.length - 1];
                fSpace = this.CalcDistance(backPos.x, backPos.y, tPos.x, tPos.y);
            }else{
                TraceVector.push(tPos);
                continue;
            }
            
            if (fSpace >= tfDis ) {
                tPos.angle = this.CalcAngle(backPos.x, backPos.y, tPos.x, tPos.y);
                TraceVector.push(tPos);
            }
            t += 0.001;
        };
    },

    BuildBezierByPointArr : function(CtrlPointArr,ResultPointArr){
        let marr = CtrlPointArr;
        let pointlength = marr.length;//总的点数
        let linenumber = Math.floor((pointlength - 3) / 2) + 1;//要画几次,计算几个贝塞尔曲线
        for (let i = 0; i < linenumber; ++i) {
            let p0 = marr[i * 2];
            let p1 = marr[i * 2 + 1];
            let p2 = marr[i * 2 + 2];
            var xArr = [p0.x, p1.x, p2.x];
            var yArr = [p0.y, p1.y, p2.y];
            this.BuildBezierWithAngle(xArr, yArr, 3, ResultPointArr, 10);
        }
    },


};

