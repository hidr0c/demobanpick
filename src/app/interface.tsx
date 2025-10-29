export interface Song {
  imgUrl: string;
  artist: string;
  title: string;
  lv: string;
  diff: string;
  isDx: boolean;
}

export interface RoundSetting {
  poolPath: string;
  totalBanPick: number;
  ban: number;
  pick: number;
}