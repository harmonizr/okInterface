console.log($request.url)
const url = $request.url;
// 替换成你的真实接口地址

// 核心解析方法（带全调试，能看到每一步问题）
async function getPlainToJson() {
  console.log("👉 开始请求接口：", url);
  try {
    // 步骤1：发起请求
    const res = await fetch(url);
    console.log("✅ 请求响应状态：", res.status, res.ok);
    
    // 步骤2：获取纯文本（关键：text/plain）
    const plainText = await res.text();
    console.log("📝 接口返回的纯文本：", plainText); // 重点看这个输出！
    
    // 步骤3：去空格后解析（最基础的核心解析）
    const jsonData = JSON.parse(plainText.trim());
    console.log("🎉 解析成功JSON：", jsonData);
    return jsonData;

  } catch (err) {
    // 精准定位错误原因
    console.error("❌ 失败原因：", err.name, "→", err.message);
    return null;
  }
}

// 调用执行
getPlainToJson();
// var body = $response.body;//声明一个变量body并以响应消息体赋值
// var obj = JSON.parse(body);//JSON.parse()将json形式的body转变成对象处理
// obj = JSON.parse(data);//JSON.parse()将json形式的body转变成对象处理
// obj.datas.xxyyVipLevel = 1;

// obj.datas.fzVipDeadline = 1769498970000;
// obj.datas.vipDeadline = 1769498970000;
// obj.datas.xxyyVipDeadline = 1769498970000;

// obj.datas.dpVipDeadline = 1769498970000;
// obj.datas.flippedVipDeadline = 1769498970000;
// obj.datas.zcnVipDeadline = 1769498970000;
// obj.datas.ybVipDeadline = 1769498970000;

// obj.datas.xxyyVipFlag = 1;
// obj.datas.vipFlag = 1;

// obj.datas.zcnVipFlag = 1;
// obj.datas.foreverVipFlag = 1;
// obj.datas.flippedForeverVipFlag = 1;



// body = JSON.stringify(obj);//重新打包回json字符串
// $done({body});//结束修改