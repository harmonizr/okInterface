console.log($request.url)
const url = $request.url;  
async function getPlainToJson() {
  console.log("👉 开始请求接口：", API_URL);
  // 1. 创建中断控制器，3秒后强制中断请求
  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => {
    controller.abort();
    console.log("❌ 请求超时，已主动中断");
  }, 5000); // 3秒超时，可改5000=5秒

  try {
    // 2. 请求带中断信号，超时会直接进入catch
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutTimer); // 成功响应，清除超时器

    console.log("✅ 请求响应状态：", res.status);
    const plainText = await res.text();
    const jsonData = JSON.parse(plainText.trim());
    console.log("🎉 解析成功：", jsonData);
    return jsonData;

  } catch (err) {
    clearTimeout(timeoutTimer); // 失败/超时，清除超时器
    if (err.name === "AbortError") {
      alert("请求超时，请稍后重试"); // 给用户提示，不卡页面
    } else {
      console.error("❌ 请求失败：", err.message);
      alert("请求失败，检查网络/接口");
    }
    return null;
  }
}
// 调用
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