//@charset "utf-8";
/*
    使用说明：
    1. 引入//s.thsi.cn/js/m/business/localSaveData.js
    2. 可以调用初始化dataLocalSave先进行配置。
    可选参数：
    key: 存入localStorage的key值，默认为dataLocalSave；
    delTime：清除存储值的时间，默认为10分钟，单位为毫秒；
    isObj： 存入的是否为对象，默认为false;
    infiniteTime  可以是否不需要清除存储值的时间，默认为false，即需要删除时间;
    3. 使用dataLocalSave.setData存入值，只接收一个参数，如果是对象，需要先调用dataLocalSave.init方法设isObj为true才能存入。
    4. 使用dataLocalSave.getData取出存入的值，接收2个参数，
    第一个参数为字符串，可查找存储中存入的字符串或对象中的值，查找对象时，会遍历对象中所有对应的key值，然后将找到的所有对象放在一个数组里返回出来。
    第二个参数为回调函数，在未找到该字段或该字段过期时被调用。在回调参数中可以带一个参数，参数返回的是过期的存储值
    5. 使用dataLocalSave.changeData可以用来改变之前存入的某个值。
    接收2个参数，第一个为需要改变的值，如果之前设置isObj为true,必须传入完整的存入对象。
    第二个参数为改变的值。如果之前设置isObj为true，这里需要传入的也是一个Object。
    例子：
    1. 初始化：
    var dataLocalTest = new dataLocalSave({
        key: 'dataLocal', // 如果不设置默认为'dataLocalSave'
        delTime: 100000, // 如果不设置默认为600000
        isObj: true  // 传入存储的是否为对象，默认为false
        infiniteTime: false  // 是否没有删除时间，默认为false
    })
    2. 设置
    dataLocalTest.setData('东方证券')
    或
    dataLocalTest.setData({name:'东方财富',num:15324})
    3. 获取
    dataLocalTest.getData('东方证券',function(res){
        console.log('数据已过期或未找到')
        console.log(res)
    })
    返回： '东方证券'
    或
    dataLocalTest.getData('东方财富',function(res){
        console.log('数据已过期或未找到')
        console.log(res)
    })
    返回： [{name:'东方财富',num:15324}]
    4. 改变
    dataLocalTest.changeData('东方证券','东方证券1')
    dataLocalTest.changeData({name:'东方财富',num:15324},{name:'东方财富',num:12345})
*/
;(function(win){
    function dataLocalSave(){
        this.init.apply(this, arguments);
    }
    dataLocalSave.prototype = {
        init: function (params) {
            this.key = params.key ? params.key : 'dataLocalSave'
            this.delTime = params.delTime ? params.delTime : 600000
            this.isObj = params.isObj ? params.isObj : false
            this.infiniteTime = params.infiniteTime ? params.infiniteTime : false
        },
        setData: function (value) {
            var curTime = new Date().getTime(),
                data = JSON.parse(localStorage.getItem(this.key)),
                haveData,
                _this = this;
            if ((typeof(value) === 'object' && _this.isObj) || (typeof(value) !== 'object' && !_this.isObj)) {
                if (data) {
                    data.forEach(function (item) {
                        if (_this.isObj) {
                            if (_this.diff(item.value,value)) {
                                haveData = true;
                            }
                        } else {
                            if (item.value == value){
                                haveData = true;
                            }
                        }
                    })
                }
                if (!haveData) {
                    if (data) {
                        data.push({value:value,curTime:curTime})
                    } else {
                        data = [{value:value,curTime:curTime}]
                    }
                    localStorage.setItem(_this.key,JSON.stringify(data));
                }
            }
        },
        getData: function (value, callback) {
            var data = JSON.parse(localStorage.getItem(this.key)),
                nowTime = new Date().getTime(),
                checkVal = [],
                haveData = false,
                _this = this,
                vindex;
            if (data) {
                data.forEach(function (item,index) {
                    if (_this.isObj) {
                        for (var val in item.value) {
                            if (item.value[val] === value) {
                                haveData = true;
                                if (nowTime - item.curTime <= _this.delTime || _this.infinite) {
                                    checkVal.push(item.value);
                                } else {
                                    callback ? callback(item.value) : '';
                                    vindex = index;
                                }
                            }
                        }
                    } else {
                        if (item.value === value) {
                            haveData = true;
                            if (nowTime - item.curTime <= _this.delTime || _this.infinite) {
                                checkVal = value;
                            } else {
                                callback ? callback(item.value) : '';
                                vindex = index;
                            }
                        }
                    }
                });
            }
            if (!haveData) {
                callback ? callback() : ''
            }
            if (vindex != undefined) {
                this.delData(vindex)
            }
            if (checkVal) {
                return checkVal
            }
        },
        changeData: function (oldVal, newVal) {
            var data = JSON.parse(localStorage.getItem(this.key)),
                _this = this,
                val,
                vindex;
            if (_this.isObj) {
                if (oldVal instanceof Object) {
                    val = oldVal;
                } else {
                    return false;
                }
            }
            if (data) {
                data.forEach(function(item,index){
                    if (_this.isObj) {
                        if (_this.diff(item.value,val)) {
                            vindex = index;
                        }
                    } else if (!_this.isObj && typeof(val) !== 'object'){
                        if (item.value == val) {
                            vindex = index;
                        }
                    }
                })
            }
            if (vindex != undefined) {
                data.splice(vindex, 1, {value:newVal,curTime:new Date().getTime()});
                localStorage.setItem(_this.key,JSON.stringify(data));
            }
        },
        delData: function (index) {
            var data = JSON.parse(localStorage.getItem(this.key));
            data.splice(index, 1);
            localStorage.setItem(this.key,JSON.stringify(data));
        },
        diff: function (obj1,obj2){
            var o1 = obj1 instanceof Object;
            var o2 = obj2 instanceof Object;
            if(!o1 || !o2){
                return obj1 === obj2;
            }
            if(Object.keys(obj1).length !== Object.keys(obj2).length){
                return false;
            }
            for(var attr in obj1){
                var t1 = obj1[attr] instanceof Object;
                var t2 = obj2[attr] instanceof Object;
                if(t1 && t2){
                    return diff(obj1[attr],obj2[attr]);
                }else if(obj1[attr] !== obj2[attr]){
                    return false;
                }
            }
            return true;
        }
    }
    win.dataLocalSave = dataLocalSave;
}(window));