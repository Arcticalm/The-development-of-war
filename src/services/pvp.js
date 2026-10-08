'use strict';
/**
 * 联机服务接入边界：后续注入真实实现，成功连接后返回远端对局会话。
 * 当前实现仅说明不可用，不创建房间、玩家会话或 AI 替代对手。
 */
class UnavailablePvpService {
  getAvailability(){return {available:false,message:'在线对战尚未开放'};}
  unavailable(){return Promise.resolve({ok:false,errorCode:'PVP_UNAVAILABLE',message:'在线对战尚未开放'});}
  ensureSession(){return this.unavailable();}
  matchmake(){return this.unavailable();}
  cancelMatchmaking(){return this.unavailable();}
  createRoom(){return this.unavailable();}
  joinRoom(roomCode){return this.unavailable();}
  leaveRoom(){return this.unavailable();}
  setReady(ready){return this.unavailable();}
  connectMatch(matchId){return this.unavailable();}
  reconnect(matchId){return this.unavailable();}
}
module.exports={UnavailablePvpService};
