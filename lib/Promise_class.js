// IIFE自定义promise模块
(function(window){

    const PENDING='pending';
    const RESOLVED='resolved';
    const REJECTED='rejected';

    //promise的构造函数
    //参数执行器函数(同步执行)
    function Promise(excutor){
        let self=this;
        self.status=PENDING//给promise对象指定status属性，初始值为pending
        self.data=undefined//给promise对象指定一个用于储存结果数据的属性
        self.callbacks=[]//回调//每个元素的结构 {onResolved(){},onRejected(){}}
        function resolve(value){
            //如果当前状态不是pending，直接fanhui
            if(self.status!=PENDING){
                return;
            }
            //将状态改为resolved
            self.status=RESOLVED;
            //保存value数据
            self.data=value;
            //如果由待执行的callback函数，立即异步执行回调函数 onResolved
            if(self.callbacks.length>0){
                setTimeout(()=>{
                    self.callbacks.forEach(callbacksObj => {
                        callbacksObj.onResolved(value);
                    });
                })
            }
        }
        function reject(reason){
             //如果当前状态不是pending，直接fanhui
             if(self.status!=PENDING){
                return;
            }
            //将状态改为rejected
            self.status=REJECTED;
            //保存reason数据
            self.data=reason;
            //如果由待执行的callback函数，立即异步执行回调函数 onRejected
            if(self.callbacks.length>0){
                setTimeout(()=>{
                    console.log('setTimeout')
                    self.callbacks.forEach(callbacksObj => {
                        callbacksObj.onRejected(reason)
                    });
                })
            }
        }
        //立即同步执行执行器函数
        try{
            console.log('try')
            excutor(resolve,reject)
        }catch(error){//如果执行器抛出异常，promise对象变为rejected状态
            reject(error)
            console.log('catch',error)
        }


    }

    //Promise原型对象的then()方法
    //指定成功或失败的回调函数
    //返回一个新的promise对象
    //返回promise的结果由onResolved/onRejected执行结果决定
    Promise.prototype.then=function(onResolved,onRejected){//then里的两个回调函数
        onResolved=  typeof onResolved=='function'?onResolved:value=>value;//向后传递成功的value
        onRejected=  typeof onRejected=='function'?onRejected:reason=>{throw reason}//指定默认的失败的回调（实现错误/异常穿透）
        let self=this;
        //返回一个新的promise对象
        return new Promise((resolve,reject)=>{
            console.log('执行.then啦')
            function handle(callback){//调用指定回调函数处理，根据执行结果，改变return的promise状态
                    // 1,如果抛出异常,return的promise变为rejected,reason为抛出的异常,
                    // 2,如果回调函数返回的是非promise的任意值,return的promise变为resolved,value为返回的值
                    // 3,如果回调函数返回的是promise,return的promise的结果就是这个promise的结果
                    try{
                        const result= callback(self.data);
                        console.log('sssssssss',result)
                      //   if(result.constructor===Promise){
                        if(result instanceof Promise){
                            result.then(
                                value=>{//当result成功时，return的promise的结果也成功
                                    resolve(value);
                                },
                                reason=>{//当result失败时，return的promise的结果也失败
                                    reject(reason)
                                }
                            )
                          //   result.then(resolve,reject)
                        }else{
                            resolve(result)
                        }
                      }catch(error){
                          reject(error)
                      }
            }
            if(self.status==PENDING){//当前状态还是pending状态，将回调函数保存起来
                console.log('状态',PENDING)
                self.callbacks.push({
                    // onResolved,onRejected
                    onResolved(value){
                        // onResolved(self.data)//value
                        handle(onResolved)
                    },
                    onRejected(reason){
                        // onRejected(self.data)
                        handle(onRejected)
                    }
                })
            }else if(self.status==RESOLVED){//如果当前时resolved状态，异步执行onResolved并改变return的promise的结果
                console.log('状态',RESOLVED)
                setTimeout(()=>{
                   handle(onResolved)
               })
            }else{//如果当前时reject状态，异步执行onRejected并改变return的promise的结果
                console.log('状态',REJECTED)
                // setTimeout(()=>{
                //     onRejected(self.data);
                // })
                setTimeout(()=>{
                    handle(onRejected)
                })
            }
        })

    }
    //Promise原型对象的catch()方法
    //指定失败的回调函数
    //返回一个新的promise对象
    Promise.prototype.catch=function(onRejected){
        return this.then(undefined,onRejected)

    }
    //Promise函数对象的resolve方法
    //返回指定结果的成功/失败的promise
    Promise.resolve=function(value){
        return new Promise((resolve,reject)=>{
            //value是promise
            if(value instanceof Promise){
                value.then(resolve,reject)

            }else{//value不是promise
                resolve(value)
            }
           
         })
    }
    //Promise函数对象的reject方法
    //返回指定reason的失败的promise
    Promise.reject=function(reason){
         return new Promise((resolve,reject)=>{
            reject(reason)
         })
    }
    //Promise函数对象的all方法
    //返回一个promise，只有所有promise都成功才成功，否则失败
    Promise.all=function(promises){
        //用来保存所有成功value的数组
        const values=new Array(promises.length)
        //用来保存成功promise的数量
        let resolvedCount=0;
         return new Promise((resolve,reject)=>{
            //遍历获取每个promise的结果
            promises.forEach((p,index)=>{
                // p.then(？？？？？？？
                Promise.resolve(p).then(//可能p是个数字，所有用Promise.resolve(p)包起来
                    value=>{
                        resolvedCount++;
                        //p成功，把成功的value保存入values
                        //values.push(value) --不行，此时顺序是成功的先后顺序
                        values[index]=value;

                        //如果全部成功了，将return的promise改变为成功
                        if(resolvedCount==promises.length){//index==promises.length-1，不行index同步遍历很快完成
                            resolve(values)
                        }
                    },
                    reason=>{//只要一个失败了，return的promise就失败
                        reject(reason)//不会覆盖，再次执行reject，status不是pending直接返回
                    }
                )
            })
         })
    }
    //Promise函数对象的race方法
    //返回一个promise，其结果由第一个完成的promise来决定
     Promise.race=function(promises){
         return new Promise((resolve,reject)=>{
             //遍历获取每个promise的结果
             promises.forEach((p)=>{
                Promise.resolve(p).then(
                    value=>{//一旦有成功了，将return变为成功，不会覆盖，tatus不是pending直接返回
                        resolve(value)
                    },
                    reason=>{//一旦有失败了，将return变为失败
                        reject(reason)
                    }
                )
             })

         })

    }

    //返回一个promise对象，他在指定时间后才返回结果
    Promise.resolveDelay=function(value,time){
        
            return new Promise((resolve,reject)=>{
                setTimeout(()=>{
                    //value是promise
                    if(value instanceof Promise){
                        value.then(resolve,reject)
        
                    }else{//value不是promise
                        resolve(value)
                    }
                },time)
               
             })
    
    }

    //返回一个promise对象，他在指定时间后才失败
    Promise.rejectDelay=function(reason,time){
        return new Promise((resolve,reject)=>{
            setTimeout(()=>{
                reject(reason)
            },time)
         })
    }


    //向外暴露promise函数
    window.Promise=Promise;
})(window)