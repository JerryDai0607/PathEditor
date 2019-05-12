var tBezier = require("Bezier");
var D_SIZE = cc.v2(1136, 640);
var D_SCALE = 100;
var EditState = {//工作状态
    NONE: 0,
    ADDPOINT: 1,
    REMOVEPOINT: 2,
    MOVEPOINT: 3,
    MOVEALL: 4,
    PREVIEW :5,
};
var STATE_CH = ["空闲中", "添加点", "删除点", "移动点", "整体移","预览中"];//当前工作状态的中文
window.C_STATE = EditState.NONE;
window.C_POINT_ARR = [];//存放所有点的数组
window.R_POINT_ARR = [];//存放切割贝塞尔后的点的最终数组

window.EventNotice = {
    POINT_REMOVE: "POINT_REMOVE",
    POINT_MOVE: "POINT_MOVE",
    FINISH_PREVIEW: "FINISH_PREVIEW",
};

cc.Class({
    extends: cc.Component,

    properties: {
        drawTableNode1: {
            type: cc.Node,
            default: null
        },

        point: {
            type: cc.Prefab,
            default: null
        },

        showCurrentState: {
            type: cc.RichText,
            default: null,
        },

        /**
         * 这个是放所有点的层，其实这个就是模拟的鱼的场景
         * 我的设计分表率是1130，640的，而且锚点在左下角，需要根据实际游戏的渔场大小和锚点设置
         */
        pointLayer: {
            type: cc.Node,
            default: null,
        },

        drawpoint: {
            type: cc.Node,
            default: null,
        },

        lawpoint: {
            type: cc.Node,
            default: null,
        },

        warmTip: {
            type: cc.Node,
            default: null,
        },

        fish: {
            type: cc.Prefab,
            default: null,
        },

        previewLabel : {
            type:cc.Label,
            default:null
        },

        labelCurrentDSize : {
            type : cc.Label,
            default :null
        },

        editCurrentDsizeX : {
            type : cc.EditBox,
            default:null,
        },

        editCurrentDsizeY : {
            type : cc.EditBox,
            default:null,
        },

        labelCurrentScale :{
            type : cc.Label,
            default :null,
        },
    },

    showWarn : function(str){

    },

    setLocalStorage : function(){
        let str = D_SIZE.x+":"+D_SIZE.y;
        cc.sys.localStorage.setItem("FISHPATHEDITOR_DESIGNSIZE", str);
    },

    getLocalStorage : function(){
        let str = cc.sys.localStorage.getItem("FISHPATHEDITOR_DESIGNSIZE");
        cc.log("getLocalStorage:"+str);
        if(str){
            let strarr = str.split(":");
            D_SIZE.x = Number(strarr[0]);
            D_SIZE.y = Number(strarr[1]);
        }else{
            D_SIZE.x = 1136;
            D_SIZE.y = 640;
            this.setLocalStorage();
        }
    },

    showCurrentDesignSize : function(){
        this.labelCurrentDSize.string = "当前设计分辨率:"+D_SIZE.x+"x"+D_SIZE.y;
        this.editCurrentDsizeX.placeholder = ""+D_SIZE.x;
        this.editCurrentDsizeY.placeholder = ""+D_SIZE.y;
    },

    onEnable: function () {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        this.node.on(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.node.on(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.node.on(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
        this.node.on(EventNotice.POINT_REMOVE, this.pointRemove, this);
        this.node.on(EventNotice.POINT_MOVE, this.pointMove, this);
        this.node.on(EventNotice.FINISH_PREVIEW, this.finishPreview, this);
    },

    onDisable: function () {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
        this.node.off(cc.Node.EventType.MOUSE_DOWN, this.onMouseDown, this);
        this.node.off(cc.Node.EventType.MOUSE_MOVE, this.onMouseMove, this);
        this.node.off(cc.Node.EventType.MOUSE_UP, this.onMouseUp, this);
        this.node.off(EventNotice.POINT_REMOVE, this.pointRemove, this);
        this.node.off(EventNotice.POINT_MOVE, this.pointMove, this);
        this.node.off(EventNotice.FINISH_PREVIEW, this.finishPreview, this);
    },

    onLoad: function () {
        this.getLocalStorage();
        this.refreshCurrentTable();
        this.showWorkingState();
        this.showCurrentDesignSize();
        this.showCurrentScale();
    },

    initParam: function () {
        window.C_STATE = EditState.NONE;
        window.C_POINT_ARR = [];
    },

    createPoint: function (pos) {
        let point = cc.instantiate(this.point);
        this.pointLayer.addChild(point);
        point.setPosition(pos);
        C_POINT_ARR.push(point);
        cc.log("C_POINT_ARR.length" + C_POINT_ARR.length);
        this.drawLaw();
        this.drawBezier();
    },

    drawLaw: function () {
        if (C_POINT_ARR.length >= 1) {
            this.dropLawLine();
            for (var i = 0; i < C_POINT_ARR.length - 1; ++i) {
                let p0 = C_POINT_ARR[i];
                let p1 = C_POINT_ARR[i + 1];
                this.drawRealLawLine(p0, p1);
            }
        }
    },

    drawRealLawLine: function (p0, p1) {
        let fpoint = this.lawpoint.getComponent(cc.Graphics);
        fpoint.moveTo(p0.x, p0.y);
        fpoint.lineTo(p1.x, p1.y);
        fpoint.stroke();
    },

    dropLawLine: function () {
        let fpoint = this.lawpoint.getComponent(cc.Graphics);
        fpoint.clear();
    },

    drawBezier: function () {
        if (C_POINT_ARR.length >= 3) {
            this.dropRealLine();
            let pointlength = C_POINT_ARR.length;//总的点数
            let linenumber = Math.floor((pointlength - 3) / 2) + 1;//要画几次
            for (let i = 0; i < linenumber; ++i) {
                let p0 = C_POINT_ARR[i * 2];
                let p1 = C_POINT_ARR[i * 2 + 1];
                let p2 = C_POINT_ARR[i * 2 + 2];
                this.drawRealLine(p0, p1, p2);
            }
        } else {
            this.dropRealLine();
        }
    },

    drawRealLine: function (p0, p1, p2) {
        let fpoint = this.drawpoint.getComponent(cc.Graphics);
        fpoint.moveTo(p0.x, p0.y);
        fpoint.quadraticCurveTo(p1.x, p1.y, p2.x, p2.y);
        fpoint.stroke();
    },

    dropRealLine: function () {
        let fpoint = this.drawpoint.getComponent(cc.Graphics);
        fpoint.clear();
    },

    drawGameTable: function () {
        //this.drawTableNode1.scale = (D_SCALE*0.01);
        var ctx1 = this.drawTableNode1.getComponent(cc.Graphics);
        ctx1.clear();
        //ctx1.rect(-D_SIZE.x*0.5, -D_SIZE.y *0.5, D_SIZE.x, D_SIZE.y);
        ctx1.rect(-D_SIZE.x*0.5*(D_SCALE/100), -D_SIZE.y *0.5*(D_SCALE/100), D_SIZE.x*(D_SCALE/100), D_SIZE.y*(D_SCALE/100));
        ctx1.stroke();
    },

    onKeyDown: function (event) {
        let keyCode = event.keyCode;
        //console.log('Press a key:'+keyCode);
        switch (keyCode) {
            case cc.macro.KEY.ctrl: {
                this.changeWorkingState(EditState.ADDPOINT);
            } break;
            case cc.macro.KEY.alt: {
                this.changeWorkingState(EditState.REMOVEPOINT);
            } break;
            case cc.macro.KEY.d: {
                this.changeWorkingState(EditState.MOVEPOINT);
            } break;
            case cc.macro.KEY.f: {
                this.changeWorkingState(EditState.MOVEALL);
            } break;
        }

    },

    onKeyUp: function (event) {
        let keyCode = event.keyCode;
        console.log('unPress a key:' + keyCode);
        switch (keyCode) {
            case cc.macro.KEY.ctrl: {
                this.cancleWoringState(EditState.ADDPOINT);
            } break;
            case cc.macro.KEY.alt: {
                this.cancleWoringState(EditState.REMOVEPOINT);
            } break;
            case cc.macro.KEY.d: {
                this.cancleWoringState(EditState.MOVEPOINT);
            } break;
            case cc.macro.KEY.f: {
                this.cancleWoringState(EditState.MOVEALL);
            } break;
        }
    },

    onMouseDown: function (event) {
        cc.log("onMouseDown");
    },

    onMouseMove: function (event) {
        //cc.log("onMouseMove");
    },

    onMouseUp: function (event) {
        cc.log("onMouseUp");
        switch (C_STATE) {
            case EditState.ADDPOINT: {
                let pos = event.getLocation();
                cc.log("1createPoint:" + pos);
                let pos2 = this.pointLayer.convertToNodeSpace(pos);
                cc.log("2createPoint:" + pos2);
                
                this.createPoint(pos2);
            } break;
        }
    },

    changeWorkingState: function (tag) {
        if (window.C_STATE == EditState.NONE) {
            window.C_STATE = tag;
            this.showWorkingState();
            this.showWarmTip(C_STATE == EditState.MOVEPOINT || C_STATE == EditState.MOVEALL)
        }
    },

    cancleWoringState: function (tag) {
        if (C_STATE == tag) {
            C_STATE = EditState.NONE;
            this.showWorkingState();
            this.showWarmTip(false);
        }
    },

    showWorkingState: function () {
        var itext = "<color=#00ff00>当前模式:</color><color=#0fffff>" + STATE_CH[C_STATE] + "</color>";
        this.showCurrentState.string = itext;
    },

    pointRemove: function () {
        this.drawLaw();
        this.drawBezier();
    },

    pointMove: function () {
        this.drawLaw();
        this.drawBezier();
    },

    showWarmTip: function (tag) {
        this.warmTip.active = tag;
    },

    buildResult: function () {
        R_POINT_ARR = [];
        tBezier.BuildBezierByPointArr(C_POINT_ARR,R_POINT_ARR);
    },

    startPreview: function () {
        if(R_POINT_ARR.length ==0){
            cc.warn("没有生成数据");
            return;
        }
        this.changeWorkingState(EditState.PREVIEW);
        this.previewLabel.string = "结束预览";
        let fish = cc.instantiate(this.fish);
        fish.getComponent("Fish").setPath();
        this.pointLayer.addChild(fish,10,"PreviewFish");
    },

    stopPreview : function(){
        cc.log("stopPreview");
        this.finishPreview();
        let fish =this.pointLayer.getChildByName("PreviewFish");
        if(fish){
            fish.destroy();
        } 
    },

    finishPreview: function () {
        cc.log("finishPreview");
        this.cancleWoringState(EditState.PREVIEW);
        this.previewLabel.string = "开始预览";
    },


    onBtnClickCallBack : function(event){
        let node = event.target;
        switch(node.name){
            case "BTN_PREVIEW" :{
                this.clickPreviewBtn();
            }break;
            case "BTN_RESIZE" :{
                this.clickResizeBtn();
            }break;
            case "BTN_ADD":{
                this.changeWorkSpaceScale(10);
            }break;
            case "BTN_REM":{
                this.changeWorkSpaceScale(-10);
            }break;
            case "BTN_CLEAR":{
                this.clearPoint();
            }break;
            case "BTN_BUILD":{
                this.buildResult();
            }break;
        }
    },

    clickPreviewBtn : function(){
        if (C_STATE == EditState.NONE) {
            this.startPreview();
            return;
        }
        if(C_STATE == EditState.PREVIEW){
            this.stopPreview();
        }
    },

    onEditDidBegan: function(editbox, customEventData) {
        cc.log("onEditDidBegan");
    },
    
    onEditDidEnded: function(editbox, customEventData) {
        cc.log("onEditDidEnded");
    },
   
    onTextChanged: function(text, editbox, customEventData) {
        cc.log("onTextChanged"+text);
    },

    clickResizeBtn : function(){
        let ix = this.editCurrentDsizeX.string;
        let iy = this.editCurrentDsizeY.string;
        cc.log("-clickResizeBtnx:"+this.editCurrentDsizeX.string);
        cc.log("-clickResizeBtny:"+this.editCurrentDsizeY.string);
        
        if(ix =="" || iy ==""){
            this.showWarn("数字不能为空");
            return;
        }

        if(Number(ix)==0 || Number(iy) ==0){
            this.showWarn("数字不能为0");
            return;
        }

        if(Number(ix)==D_SIZE.x && Number(iy) ==D_SIZE.y){
            return;
        }

        if(Number(ix)>=1920 || Number(iy)>=1080){//todo 还有缩放系数
            this.showWarn("调节缩放按钮，以获得合适的区域");
        }

        D_SIZE.x = Number(ix);
        D_SIZE.y = Number(iy);
        this.setLocalStorage();
        this.showCurrentDesignSize();
        this.refreshCurrentTable();
    },

    refreshCurrentTable : function(){
        this.drawGameTable();
        this.setPointLayer();
    },

    setPointLayer : function(){
        this.pointLayer.width =  D_SIZE.x;
        this.pointLayer.height =  D_SIZE.y;
        this.pointLayer.x = -D_SIZE.x*0.5*(D_SCALE*0.01);
        this.pointLayer.y = -D_SIZE.y*0.5*(D_SCALE*0.01);
        this.pointLayer.scale = (D_SCALE*0.01);
    },

    showCurrentScale : function(){
        this.labelCurrentScale.string = "工作区缩放比例"+Math.floor(D_SCALE)+"%";
    },

    changeWorkSpaceScale : function(tag){
        let cscale = D_SCALE+tag;
        if(cscale>200 || cscale<=0){
            this.showWarn("超过最大缩放比例");
            return
        }
        D_SCALE = cscale;
        this.showCurrentScale();
        this.refreshCurrentTable();

    },

    clearPoint : function(){
        for(var i =0;i<C_POINT_ARR.length;++i){
            C_POINT_ARR[i].destroy();
        }
        this.dropRealLine();
        this.dropLawLine();
        C_POINT_ARR = [];
        R_POINT_ARR = [];
    },

});
