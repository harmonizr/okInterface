console.log(typeof $response.body)
const url = $request.url;  
// 在 Loon 的脚本中
const response = $response;
const body = response.body;

try {
  // 如果 body 是字符串，直接解析
  if (typeof body === 'string') {
    const jsonData = JSON.parse(body);
    console.log('解析成功:', jsonData);
    
    // 处理你的数据...
    
    // 如果需要修改响应
    // $done({body: JSON.stringify(jsonData)});
  } 
  // 如果 body 是二进制数据，先转字符串
  else if (body instanceof ArrayBuffer) {
    const decoder = new TextDecoder('utf-8');
    const text = decoder.decode(body);
    const jsonData = JSON.parse(text);
    console.log('解析成功:', jsonData);
  }
} catch (error) {
  console.log('JSON 解析错误:', error);
}

$done();
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