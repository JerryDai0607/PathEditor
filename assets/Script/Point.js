const filename = "Point.js";
var Editor = require("Editor");
cc.Class({
    extends: cc.Component,

    properties: {
        _movePoint: false,

    },

    onEnable: function () {
        this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.node.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.node.on(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
        this.node.on(cc.Node.EventType.MOUSE_ENTER, this.onMouseEnter, this);
        this.node.on(cc.Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
    },

    onDisable: function () {
        this.node.off(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.node.off(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.node.off(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
        this.node.off(cc.Node.EventType.MOUSE_ENTER, this.onMouseEnter, this);
        this.node.off(cc.Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
    },

    onLoad: function () {
        this._movePoint = false;
        var ctx = this.node.getComponent(cc.Graphics);
        ctx.circle(0, 0, 20);
        ctx.stroke();
    },

    onMouseEnter: function () {
        if (C_STATE == 1) { return }
        var ctx = this.node.getComponent(cc.Graphics);
        ctx.strokeColor = new cc.color("FF5A00");
        ctx.stroke();
    },

    onMouseLeave: function (event) {
        cc.log("onMouseLeave" + this._movePoint);
        if (C_STATE == 1) { return }

        var ctx = this.node.getComponent(cc.Graphics);
        ctx.strokeColor = new cc.color("07D488");
        ctx.stroke();

        if (this._movePoint == true) {
            this.node.dispatchEvent(new cc.Event.EventCustom(EventNotice.POINT_MOVE, true));
            this._movePoint = false;
            cc.log("-----设置为false");
        }
    },

    onMouseDown: function () {
        if (C_STATE == 3 || C_STATE == 4) {
            this._movePoint = true;
            cc.log("-----设置为true");
        }
    },

    onMouseMove: function (event) {
        if (this._movePoint == true) {
            let deltapos = event.getDelta();
            if (C_STATE == 3) {
                this.node.x += deltapos.x;
                this.node.y += deltapos.y;
            } else if (C_STATE == 4) {
                for (var i = 0; i < C_POINT_ARR.length; ++i) {
                    C_POINT_ARR[i].x += deltapos.x;
                    C_POINT_ARR[i].y += deltapos.y;
                }
            }
            this.node.dispatchEvent(new cc.Event.EventCustom(EventNotice.POINT_MOVE, true));
        }

    },

    onMouseUp: function () {
        if (C_STATE == 2) {//删除点的状态
            var index = C_POINT_ARR.indexOf(this.node);
            if (index > -1) {
                C_POINT_ARR.splice(index, 1);
                this.node.dispatchEvent(new cc.Event.EventCustom(EventNotice.POINT_REMOVE, true));
                this.node.destroy();
            } else {
                cc.warn(filename + "出现bug,函数:" + "onMouseUp");
            }
        }

        if (this._movePoint == true) {
            this.node.dispatchEvent(new cc.Event.EventCustom(EventNotice.POINT_MOVE, true));
            this._movePoint = false;
            cc.log("-----设置为false");
        }

    },
});
