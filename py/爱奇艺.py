#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import re
import requests
import math
from urllib.parse import urlencode, quote


class Spider:

    COOKIE_STRING = ''
    FILTER_ID_KEYWORDS = "游戏,纪录片,原创,片花,教育,健康,军事,脱口秀,母婴,娱乐,生活,财经,体育,科技,搞笑,音乐,旅游,时尚,资讯,微剧,漫剧"
    FILTER_NAME_KEYWORDS = "采访,特辑,混剪,动态漫画,《,纪录片,片段,预告,花絮,片花,MV,主题曲,抢先看,剪辑版,精编版,纯享版,精彩片段,高能片段,名场面,剪辑,解说,分析,解读,揭秘,盘点,饭制,彩蛋,小剧场,【,"
    FILTER_ENABLED = True
    SEARCH_KEYWORD_MATCH = True

    def __init__(self):
        self.name = "爱奇艺"
        self.home_url = "https://www.iqiyi.com/"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Linux; Android 14; M2102J2SC Build/UKQ1.240624.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.6723.86 Mobile Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'x-requested-with': 'mark.via',
        }
        if self.COOKIE_STRING:
            self.headers['Cookie'] = self.COOKIE_STRING
        else:
            print("警告：COOKIE_STRING 为空，可能导致部分分类无数据")

        self.type_map = {
            '1': '电影',
            '2': '电视剧',
            '3': '纪录片',
            '4': '动漫',
            '6': '综艺',
            '15': '少儿',
            '16': '网络电影'
        }

        self.session = requests.Session()
        self.session.headers.update(self.headers)

    def getName(self):
        return self.name

    def getDependence(self):
        return ["json", "re", "requests"]

    def init(self, extend):
        return True

    def isVideoFormat(self, url):
        video_formats = ['.mp4', '.m3u8', '.flv', '.avi', '.mkv', '.ts', '.mov', '.wmv', '.webm']
        return any(fmt in url.lower() for fmt in video_formats)

    def manualVideoCheck(self):
        return False

    def homeContent(self, filter):
        result = {"class": []}
        for cid, name in self.type_map.items():
            result["class"].append({"type_id": cid, "type_name": name})
        return result

    def homeVideoContent(self):
        return {'list': []}

    def categoryContent(self, cid, pg, filter, ext):
        page = int(pg) if pg and str(pg).isdigit() else 1

        params = {
            'channel_id': cid,
            'data_type': 1,
            'page_id': page,
            'ret_num': 48
        }
        if cid == "16":
            params['channel_id'] = "1"
            params['three_category_id'] = "27401"
        elif cid == "5":
            params['data_type'] = "2"

        url = 'https://pcw-api.iqiyi.com/search/recommend/list?' + urlencode(params)

        html = self.http_get(url, referer='https://m.iqiyi.com')
        videos = self.parse_api_category_list(html, cid)

        if not videos:
            fallback_url = self.get_channel_url_fallback(cid)
            fallback_html = self.http_get(fallback_url, referer='https://m.iqiyi.com')
            videos = self.parse_channel_page_fallback(fallback_html, cid)

        seen = set()
        unique_videos = []
        for v in videos:
            if v['vod_id'] not in seen:
                seen.add(v['vod_id'])
                unique_videos.append(v)

        pagecount = 999 if len(unique_videos) >= 20 else 1

        return {
            'list': unique_videos,
            'page': page,
            'pagecount': pagecount,
            'limit': 90,
            'total': 999999
        }

    def detailContent(self, ids):
        if not ids:
            return {'list': []}

        id_str = ids[0]
        videos = []

        parts = id_str.split('$')
        if len(parts) == 2:
            first_part = parts[0]
            if ',' in first_part:
                first_parts = first_part.split(',')
                channel_id = first_parts[1] if len(first_parts) > 1 else ''
            else:
                channel_id = first_part
            album_id = parts[1]
        else:
            channel_id = ''
            album_id = id_str

        video_data = None
        if channel_id in ('1', '16'):
            video_data = self.get_movie_detail(album_id)
        elif channel_id == '5':
            video_data = self.get_music_detail(album_id)
        elif channel_id == '':
            video_data = self.get_variety_detail(album_id)
        elif channel_id in ('15', '6'):
            video_data = self.get_kids_detail(album_id)
        else:
            video_data = self.get_series_detail(album_id)

        if not video_data:
            return {'list': []}

        video_info = self.build_video_info(video_data, id_str, channel_id, album_id)
        videos.append(video_info)

        return {'list': videos}

    def get_movie_detail(self, album_id):
        url = f"https://pcw-api.iqiyi.com/video/video/playpageinfo/{album_id}"
        response = self.http_get(url, referer='https://m.iqiyi.com')
        response = self.parse_jsonp(response)
        try:
            data = json.loads(response)
            if data and 'data' in data and isinstance(data['data'], dict):
                return data['data']
        except:
            pass

        url2 = f"https://pcw-api.iqiyi.com/video/video/baseinfo/{album_id}"
        response2 = self.http_get(url2, referer='https://m.iqiyi.com')
        response2 = self.parse_jsonp(response2)
        try:
            data2 = json.loads(response2)
            if data2 and 'data' in data2 and isinstance(data2['data'], dict):
                return data2['data']
        except:
            pass
        return None

    def get_music_detail(self, album_id):
        url = f"https://pcw-api.iqiyi.com/album/album/baseinfo/{album_id}"
        response = self.http_get(url, referer='https://m.iqiyi.com')
        response = self.parse_jsonp(response)
        try:
            data = json.loads(response)
            if data and 'data' in data and isinstance(data['data'], dict):
                return data['data']
        except:
            pass
        return None

    def get_variety_detail(self, album_id):
        url = f"https://pcw-api.iqiyi.com/album/source/baseinfo/{album_id}"
        response = self.http_get(url, referer='https://m.iqiyi.com')
        response = self.parse_jsonp(response)
        try:
            data = json.loads(response)
            if data and 'data' in data and isinstance(data['data'], dict):
                return data['data']
        except:
            pass
        return None

    def get_kids_detail(self, album_id):
        return self.get_music_detail(album_id)

    def get_series_detail(self, album_id):
        url = f'https://pcw-api.iqiyi.com/video/video/videoinfowithuser/fyid?agent_type=1&authcookie=&subkey=fyid&subscribe=1&fyid={album_id}'
        response = self.http_get(url, referer='https://m.iqiyi.com')
        response = self.parse_jsonp(response)
        try:
            data = json.loads(response)
            if data and 'data' in data and isinstance(data['data'], dict):
                return data['data']
        except:
            pass

        url2 = f"https://pcw-api.iqiyi.com/album/album/baseinfo/{album_id}"
        response2 = self.http_get(url2, referer='https://m.iqiyi.com')
        response2 = self.parse_jsonp(response2)
        try:
            data2 = json.loads(response2)
            if data2 and 'data' in data2 and isinstance(data2['data'], dict):
                return data2['data']
        except:
            pass
        return None

    def build_video_info(self, json_data, ids, channel_id, album_id):
        if not isinstance(json_data, dict):
            print(f"警告：json_data 类型为 {type(json_data)}，尝试转换为字典")
            if isinstance(json_data, str):
                try:
                    json_data = json.loads(json_data)
                except:
                    json_data = {}
            else:
                json_data = {}

        vod_name = json_data.get('name') or json_data.get('albumName', '')
        vod_pic = json_data.get('imageUrl') or json_data.get('albumImage', '')
        vod_content = json_data.get('description') or json_data.get('albumDesc', '')
        vod_score = json_data.get('score', '')
        vod_focus = json_data.get('focus', '')
        vod_areas = json_data.get('areas', '')
        vod_payMark = json_data.get('payMark', 0)
        video_channel_id = json_data.get('channelId', channel_id)

        categories = []
        if 'categories' in json_data:
            for cat in json_data['categories']:
                if cat.get('name'):
                    categories.append(cat['name'])
        type_name = ','.join(categories) if categories else self.get_type_name_by_channel_id(channel_id)

        vod_remarks = ''
        try:
            if json_data.get('latestOrder'):
                vod_remarks = f"类型: {categories[0] if len(categories) > 0 else ''}\t{categories[1] if len(categories) > 1 else ''}\t{categories[2] if len(categories) > 2 else ''}\t评分：{vod_score}\n更新至：第{json_data['latestOrder']}集(期)/共{json_data.get('videoCount', '')}集(期)"
            else:
                vod_remarks = f"类型: {categories[0] if len(categories) > 0 else ''}\t{categories[1] if len(categories) > 1 else ''}\t{categories[2] if len(categories) > 2 else ''}\t评分：{vod_score}{json_data.get('period', '')}"
        except:
            vod_remarks = json_data.get('subtitle', '')

        vod_area = f"{vod_focus}\n资费：{'VIP' if vod_payMark == 1 else '免费'}\n地区：{vod_areas}" if vod_focus else f"资费：{'VIP' if vod_payMark == 1 else '免费'}\n地区：{vod_areas}"

        vod_actor = ''
        if json_data.get('people', {}).get('main_charactor'):
            actors = [a['name'] for a in json_data['people']['main_charactor'] if a.get('name')]
            vod_actor = ','.join(actors)

        episodes = self.get_playlist_by_category(json_data, album_id, video_channel_id)

        vod_pic = self.format_image_url(vod_pic)

        return {
            'vod_id': ids,
            'vod_name': vod_name,
            'vod_pic': vod_pic,
            'vod_year': '',
            'vod_content': vod_content,
            'type_name': type_name,
            'vod_area': vod_area,
            'vod_actor': vod_actor,
            'vod_director': '',
            'vod_remarks': vod_remarks,
            'vod_play_from': 'qiyi',
            'vod_play_url': '#'.join(episodes)
        }

    def get_playlist_by_category(self, video_data, album_id, channel_id):
        episodes = []
        channel_id = str(channel_id)

        if channel_id in ('1', '5'):
            if video_data.get('playUrl'):
                title = video_data.get('shortTitle', '正片')
                episodes.append(f"{title}${video_data['playUrl']}")

        elif channel_id == '6':
            period = video_data.get('period')
            if period and '-' in period:
                qs = period.split('-')[0]
                list_url = f"https://pcw-api.iqiyi.com/album/source/svlistinfo?cid=6&sourceid={album_id}&timelist={qs}"
                list_response = self.http_get(list_url, referer='https://m.iqiyi.com')
                list_response = self.parse_jsonp(list_response)
                try:
                    list_data = json.loads(list_response)
                    if list_data and 'data' in list_data and qs in list_data['data']:
                        for item in list_data['data'][qs]:
                            if item.get('playUrl'):
                                title = item.get('shortTitle', '正片')
                                episodes.append(f"{title}${item['playUrl']}")
                except:
                    pass

        else:
            list_url = f"https://pcw-api.iqiyi.com/albums/album/avlistinfo?aid={album_id}&size=200&page=1"
            list_response = self.http_get(list_url, referer='https://m.iqiyi.com')
            list_response = self.parse_jsonp(list_response)
            try:
                list_data = json.loads(list_response)
                if list_data and 'data' in list_data:
                    total = list_data['data'].get('total', 0)
                    playlists = list_data['data'].get('epsodelist', [])
                    if total > 200:
                        total_pages = math.ceil(total / 200)
                        for i in range(2, total_pages + 1):
                            page_url = f"https://pcw-api.iqiyi.com/albums/album/avlistinfo?aid={album_id}&size=200&page={i}"
                            page_response = self.http_get(page_url, referer='https://m.iqiyi.com')
                            page_response = self.parse_jsonp(page_response)
                            try:
                                page_data = json.loads(page_response)
                                if page_data and 'data' in page_data and 'epsodelist' in page_data['data']:
                                    playlists.extend(page_data['data']['epsodelist'])
                            except:
                                pass

                    for item in playlists:
                        if item.get('playUrl'):
                            title = item.get('shortTitle') or f"第{item.get('order', '')}集"
                            episodes.append(f"{title}${item['playUrl']}")
            except:
                pass

        if not episodes and video_data.get('playUrl'):
            episodes.append(f"正片${video_data['playUrl']}")

        return episodes

    def playerContent(self, flag, id, vipFlags):
        play_url = id
        if '$' in id:
            play_url = id.split('$', 1)[1]

        result = self.get_play_url(flag, play_url)

        result['header'] = json.dumps({
            **self.headers,
            'Referer': 'https://www.iqiyi.com/',
            'Origin': 'https://www.iqiyi.com'
        })
        return result

    def get_play_url(self, flag, play):
        proxy_server = 'http://127.0.0.1:9978/proxy'
        cleaned_url = play.replace('\\/', '/')

        try:
            api = cleaned_url.split('?')[0]
            response = self.http_get(api, custom_headers={
                'User-Agent': 'okhttp/3.14.9',
                'Content-Type': 'application/x-www-form-urlencoded'
            })
            bata = json.loads(response)
            if bata and 'url' in bata and 'qiyi' in bata['url']:
                result = {
                    'parse': 0,
                    'url': bata['url'],
                    'jx': 0,
                    'danmaku': f"{proxy_server}?do=danmu&site=js&url={quote(api)}"
                }
            else:
                result = {
                    'parse': 0,
                    'url': api,
                    'jx': 1,
                    'danmaku': f"{proxy_server}?do=danmu&site=js&url={quote(api)}"
                }
        except Exception as e:
            result = {
                'parse': 0,
                'url': cleaned_url.split('?')[0],
                'jx': 1,
                'danmaku': f"{proxy_server}?do=danmu&site=js&url={quote(cleaned_url)}"
            }

        return {
            'parse': result['jx'],
            'playUrl': '',
            'url': result['url'],
            'danmaku': result.get('danmaku', '')
        }

    def searchContent(self, key, quick, pg="1"):
        page = int(pg) if pg and str(pg).isdigit() else 1
        search_url = 'https://search.video.iqiyi.com/o?if=html5&key=' + quote(key.strip()) + '&pageNum=' + str(page) + '&pos=1&pageSize=24&site=iqiyi'
        response = self.http_get(search_url, referer='https://www.iqiyi.com')

        result = self.parse_search_result(response, page)

        if self.FILTER_ENABLED and (self.FILTER_ID_KEYWORDS or self.FILTER_NAME_KEYWORDS):
            result = self.filter_search_results(result)

        if self.SEARCH_KEYWORD_MATCH and key and result.get('list'):
            result = self.filter_by_search_keyword(result, key)

        return result

    def searchContentPage(self, key, quick, pg):
        return self.searchContent(key, quick, pg)

    def parse_search_result(self, html, page):
        videos = []
        try:
            data = json.loads(self.parse_jsonp(html))
            if not data or 'data' not in data or 'docinfos' not in data['data']:
                return {'page': page, 'pagecount': 1, 'limit': 0, 'total': 0, 'list': []}

            for item in data['data']['docinfos']:
                info = item['albumDocInfo']
                channel = info.get('channel', '')
                vod_name = info.get('albumTitle', '')
                vod_remarks = info.get('tvFocus') or info.get('albumSubTitle', '')
                type_id = channel
                vod_id = f"{type_id}${info['albumId']}"
                videos.append({
                    'vod_id': vod_id,
                    'vod_name': vod_name,
                    'vod_pic': self.format_image_url(info.get('albumVImage', '')),
                    'vod_remarks': vod_remarks,
                    'vod_content': '',
                    'vod_url': vod_id
                })
        except Exception as e:
            print(f"解析搜索失败: {e}")

        return {
            'page': page,
            'pagecount': 99999,
            'limit': len(videos),
            'total': 99999,
            'list': videos
        }

    def filter_search_results(self, result):
        if not result.get('list'):
            return result

        filtered_list = []
        filtered_count = 0
        id_keywords = [kw.strip() for kw in self.FILTER_ID_KEYWORDS.split(',') if kw.strip()]
        name_keywords = [kw.strip() for kw in self.FILTER_NAME_KEYWORDS.split(',') if kw.strip()]

        for item in result['list']:
            include = True
            for kw in id_keywords:
                if kw and kw.lower() in item['vod_id'].lower():
                    include = False
                    filtered_count += 1
                    break
            if include:
                for kw in name_keywords:
                    if kw and kw.lower() in item['vod_name'].lower():
                        include = False
                        filtered_count += 1
                        break
            if include:
                filtered_list.append(item)

        result['list'] = filtered_list
        result['limit'] = len(filtered_list)
        result['total'] = max(0, result['total'] - filtered_count)
        return result

    def filter_by_search_keyword(self, result, keyword):
        if not result.get('list') or not keyword:
            return result

        filtered_list = []
        filtered_count = 0
        clean_keyword = keyword.strip().lower()
        for item in result['list']:
            if clean_keyword in item['vod_name'].lower():
                filtered_list.append(item)
            else:
                filtered_count += 1

        result['list'] = filtered_list
        result['limit'] = len(filtered_list)
        result['total'] = max(0, result['total'] - filtered_count)
        return result

    def http_get(self, url, referer=None, custom_headers=None):
        headers = self.headers.copy()
        if referer:
            headers['Referer'] = referer
        if custom_headers:
            headers.update(custom_headers)

        try:
            resp = self.session.get(url, headers=headers, timeout=10)
            return resp.text
        except Exception as e:
            print(f"HTTP请求失败: {url} - {e}")
            return ''

    def parse_jsonp(self, response):
        match = re.search(r'^\s*(?:__jp\d+|[a-zA-Z0-9_]+)\s*\(\s*(.*)\s*\)\s*;?\s*$', response, re.DOTALL)
        if match:
            return match.group(1)
        return response

    def format_image_url(self, url):
        if not url:
            return ''
        if url.startswith('//'):
            return 'https:' + url
        return url

    def get_type_name_by_channel_id(self, channel_id):
        return self.type_map.get(str(channel_id), '其他')

    def get_channel_url_fallback(self, tid):
        fallback_map = {
            '1': 'https://m.iqiyi.com/dianying/',
            '2': 'https://m.iqiyi.com/dianshiju/',
            '3': 'https://m.iqiyi.com/jilupian/',
            '4': 'https://m.iqiyi.com/dongman/',
            '6': 'https://m.iqiyi.com/zongyi/',
            '15': 'https://m.iqiyi.com/shaoer/',
            '16': 'https://m.iqiyi.com/dianying/',
        }
        return fallback_map.get(str(tid), 'https://m.iqiyi.com/dianying/')

    def parse_api_category_list(self, html, tid):
        videos = []
        try:
            html = self.parse_jsonp(html)
            data = json.loads(html)
            if not data or 'data' not in data or 'list' not in data['data']:
                return []

            for item in data['data']['list']:
                vod_name = item.get('name', '')
                album_id = item.get('albumId', 0)
                channel_id = item.get('channelId', tid)
                image_url = item.get('imageUrl', '')
                if not vod_name or not album_id or not image_url:
                    continue

                vod_id = f"{channel_id}${album_id}"
                vod_pic = self.format_image_url(image_url)

                vod_remarks = ''
                if item.get('latestOrder'):
                    vod_remarks = f"更新至{item['latestOrder']}集"
                elif item.get('period'):
                    vod_remarks = item['period']
                elif item.get('focus'):
                    vod_remarks = item['focus']

                if item.get('score'):
                    if vod_remarks:
                        vod_remarks += ' '
                    vod_remarks += f"{item['score']}分"

                videos.append({
                    'vod_id': vod_id,
                    'vod_name': vod_name,
                    'vod_pic': vod_pic,
                    'vod_remarks': vod_remarks,
                    'vod_content': '',
                    'vod_url': vod_id
                })
        except Exception as e:
            print(f"解析分类API失败: {e}")
        return videos

    def parse_channel_page_fallback(self, html, tid):
        videos = []
        try:
            match = re.search(r'window\.__INITIAL_STATE__\s*=\s*(\{.*?\});', html, re.DOTALL)
            if not match:
                return []
            state = json.loads(match.group(1))

            channel_key_map = {
                '1': 'dianying',
                '2': 'dianshiju',
                '3': 'jilupian',
                '4': 'dongman',
                '6': 'zongyi',
                '15': 'shaoer',
            }
            channel_key = channel_key_map.get(str(tid), 'dianying')
            if channel_key not in state:
                return []

            cards = state[channel_key].get('cards', [])
            for card in cards:
                video_list = card.get('videos', [])
                for item in video_list:
                    album_id = item.get('albumId') or item.get('id')
                    if not album_id:
                        continue
                    channel_id = item.get('channelId', tid)
                    vod_id = f"{channel_id}${album_id}"
                    vod_name = item.get('mainTitle') or item.get('shortTitle') or item.get('name', '')
                    image_url = item.get('imageUrl') or item.get('albumImage', '')
                    if not vod_name or not image_url:
                        continue
                    vod_pic = self.format_image_url(image_url)

                    vod_remarks = ''
                    if item.get('lowerRightCorner'):
                        vod_remarks += str(item['lowerRightCorner']) + '分'
                    if item.get('upperRightCorner'):
                        if vod_remarks:
                            vod_remarks += ' '
                        vod_remarks += item['upperRightCorner']
                    if not vod_remarks:
                        vod_remarks = item.get('subtitle') or item.get('period') or item.get('desc', '')

                    videos.append({
                        'vod_id': vod_id,
                        'vod_name': vod_name,
                        'vod_pic': vod_pic,
                        'vod_remarks': vod_remarks,
                        'vod_content': '',
                        'vod_url': vod_id
                    })
        except Exception as e:
            print(f"解析回退页面失败: {e}")
        return videos

    def localProxy(self, params):
        return None