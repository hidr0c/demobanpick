export interface Song {
  id: string;
  imgUrl: string;
  artist: string;
  title: string;
  lv: string;
  diff: string;
  isDx: string;
}

export interface RoundSetting {
  poolPath: string;
  totalBanPick: number;
  ban: number;
  pick: number;
}