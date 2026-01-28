console.log($request.url)
const url = $request.url;
async function fetchData() {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP 错误: ${response.status}`);
    }
    
    const text = await response.text();
    const data = JSON.parse(text); // 在这里定义 data
    
    // 现在可以安全使用 data
    console.log('获取的数据:', data);
    renderData(data);
    
    return data; // 返回以便其他函数使用
    
  } catch (error) {
    console.error('获取数据失败:', error);
    return null;
  }
}

// 使用方式
fetchData().then(data => {
  if (data) {
    // 这里可以安全使用 data
    console.log('处理数据:', data);
  }
});
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