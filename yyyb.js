console.log($request.url)
const url = $request.url;
// const data = {};
// fetch(url)
//   .then(response => response.text())
//   .then(text => {
//     try {
//       data = JSON.parse(text);
//       console.log(data);
//     } catch (e) {
//       console.error('解析失败:', e);
//     }
// });
fetch(url)
  .then(response => {
    // 获取原始文本
    return response.text();
  })
  .then(text => {
    try {
      // 尝试解析为 JSON
      const data = JSON.parse(text);
      console.log('解析成功:', data);
      return data;
    } catch (error) {
      console.error('JSON 解析失败:', error);
      console.log('原始内容:', text);
      throw new Error('响应不是有效的 JSON 格式');
    }
  })
  .catch(error => {
    console.error('请求失败:', error);
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