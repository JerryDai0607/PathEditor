
cc.Class({
    extends: cc.Component,

    properties: {
        _pathArr: [],
        _rtime :0,
        _bOutOfScreen : false,

        /**
         * 游动速度
         */
        swimspeed: {
            type: cc.Integer,
            default: 10,
        },

        /**
         * 游动速度倍率默认1
         */
        swimrate: {
            type: cc.Integer,
            default: 1,
        },
    },

    setPath: function () {
        this._pathArr = R_POINT_ARR;
    },

    update: function (dt) {
        if (this._pathArr.length == 0) {
            cc.warn("注意，没有路径点");
            return;
        }
        if(this._bOutOfScreen){
            this.finishPreview();
        }
        this._rtime +=dt*this.swimrate;
        let fIndex = this._rtime*this.swimspeed*0.1;
        let index = parseInt(fIndex);
        if (index < 0){
            index = 0;
        }else if (index >= this._pathArr.length){
            index = this._pathArr.length-1;
        }
        let diff = fIndex-index;
        if (index < this._pathArr.length-1){
            let p1 = this._pathArr[index];
            let p2 = this._pathArr[index+1];
            this.node.x = p1.x*(1-diff)+p2.x*diff;
            this.node.y = p1.y*(1-diff)+p2.y*diff;
        }else{
            this.node.x = this._pathArr[index].x;
            this.node.y = this._pathArr[index].y;
            this._bOutOfScreen = true;
        }  
        this.node.rotation = this._pathArr[index].angle;
    },

    finishPreview : function(){
        this.node.destroy();
        this.node.dispatchEvent(new cc.Event.EventCustom(EventNotice.FINISH_PREVIEW, true));
    },


});
