
$loon.addRule({
  name: "Flipped-删除新版请求体以伪装旧版",
  priority: 100,
  processor: function(httpMessage) {
    if (httpMessage.isRequest) {
      // 1. 精确匹配目标请求
      if (httpMessage.url === 'https://flipped.binfenyingyu.com/flipped/subverter/info') {
        console.log('[脚本] 拦截到目标请求，准备删除请求体伪装旧版…');
        
        // 2. 获取请求头对象
        let headers = httpMessage.requestHeader;
        
        // 3. 【核心操作】清空请求体，并修正长度
        httpMessage.body = ""; // 清空请求体
        headers['content-length'] = '0'; // 修正为旧版长度
        
        // 4. 修改 user-agent 为旧版特征（关键）
        headers['user-agent'] = 'Yinbiao/1.8.9 (com.binfenyingyu.yinbiao; build:212; iOS 26.2.0) Alamofire/5.10.1';
        
        console.log('[脚本] 请求体已清空，user-agent已替换。');
      }
    }
  }
});
var body = $response.body;//声明一个变量body并以响应消息体赋值
var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理


obj.datas.xxyyVipLevel = 1;

obj.datas.fzVipDeadline = 1800979200000;
obj.datas.vipDeadline = 1800979200000;
obj.datas.xxyyVipDeadline = 1800979200000;

obj.datas.dpVipDeadline = 1800979200000;
obj.datas.flippedVipDeadline = 1800979200000;
obj.datas.zcnVipDeadline = 1800979200000;
obj.datas.ybVipDeadline = 1800979200000;

obj.datas.xxyyVipFlag = 1;
obj.datas.vipFlag = 1;

obj.datas.zcnVipFlag = 1;
obj.datas.foreverVipFlag = 1;
obj.datas.flippedForeverVipFlag = 1;



body = JSON.stringify(obj);//重新打包回json字符串
$done({body});//结束修改