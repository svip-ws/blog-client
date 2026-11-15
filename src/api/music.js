import request from './request';

// 获取音乐播放列表
export function getMusicPlaylist() {
    return request.get('/music/playlist');
}

// 获取当前正在播放曲目
export function getNowPlaying() {
    return request.get('/music/now-playing');
}
