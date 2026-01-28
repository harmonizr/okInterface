console.log($request.url)
const API_URL = $request.url;  
// 替换成你的真实接口地址
// 接口需要的参数（无参数就传{}，按后端要求写）
const POST_DATA = {
  // name: 'test',
  // id: 123
};

// 页面加载元素（有转圈DOM就保留，没有就注释这两行）
const loading = document.getElementById('loading'); 
const showLoading = (isShow) => loading && (loading.style.display = isShow ? 'block' : 'none');

// 核心POST请求+text/plain解析方法
async function postPlainToJson() {
  showLoading(true); // 开转圈
  const controller = new AbortController();
  // 5秒超时（可改，比如10000=10秒）
  const timeoutTimer = setTimeout(() => controller.abort(), 5000);

  try {
    console.log("👉 开始POST请求：", API_URL);
    // 关键：指定POST方法，适配接口要求
    const res = await fetch(API_URL, {
      signal: controller.signal, // 超时中断
      method: 'POST', // 必加：POST方法
      headers: {
        // 重点：按后端要求配Content-Type，以下3种是POST最常用的，选1个！
        'Content-Type': 'application/json', // 传JSON对象用（推荐，匹配上面的POST_DATA）
        // 'Content-Type': 'application/x-www-form-urlencoded', // 传表单键值对用
        // 'Content-Type': 'multipart/form-data', // 传文件/表单带文件用
      },
      body: JSON.stringify(POST_DATA) // 传参：JSON对象转字符串（对应application/json）
      // 若用x-www-form-urlencoded，body改成：new URLSearchParams(POST_DATA)
    });

    clearTimeout(timeoutTimer); // 成功响应，清除超时器
    if (!res.ok) throw new Error(`接口报错：${res.status} ${res.statusText}`);

    // 解析text/plain响应体为JSON（核心逻辑）
    const plainText = await res.text();
    const jsonData = JSON.parse(plainText.trim());
    console.log("🎉 POST请求+解析成功：", jsonData);
    showLoading(false); // 关转圈
    return jsonData;

  } catch (err) {
    clearTimeout(timeoutTimer);
    showLoading(false); // 失败/超时，强制关转圈
    if (err.name === "AbortError") {
      console.error("❌ 请求超时：后端5秒内未响应");
      alert("服务器响应超时，请稍后重试");
    } else {
      console.error("❌ 请求/解析失败：", err.message);
      alert("请求失败，请检查接口或参数");
    }
    return null;
  }
}

// 调用执行（直接跑，或绑定到按钮点击：onclick="postPlainToJson()"）
postPlainToJson();
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