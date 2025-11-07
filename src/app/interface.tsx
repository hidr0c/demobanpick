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
  name: string;
  totalBanPick: number;
  random: number;
  ban: number;
  pick: number;
}