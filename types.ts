

export enum Brand {
  BYD = '比亚迪',
  TESLA = '特斯拉',
  XIAOMI = '小米',
  NIO = '蔚来',
  XPENG = '小鹏',
  ZEEKR = '极氪',
  LIXIANG = '理想',
  AITO = '鸿蒙智行-问界',
  LUXEED = '鸿蒙智行-智界',
  STELATO = '鸿蒙智行-享界',
  MAEXTRO = '鸿蒙智行-尊界',
  LEAPMOTOR = '零跑',
  AVATR = '阿维塔',
  DEEPAL = '深蓝',
  GAC_AION = '广汽埃安',
  WULING = '五菱',
  GEELY = '吉利',
  GALAXY = '吉利银河',
  GEOMETRY = '几何',
  SMART = 'Smart',
  IM = '智己',
  DENZA = '腾势',
  LYNKCO = '领克',
  TANK = '坦克',
  ORA = '欧拉',
  VOYAH = '岚图',
  ARCFOX = '极狐',
  FANGCHENGBAO = '方程豹',
  ONVO = '乐道',
  HYPER = '昊铂',
  CHANGAN = '长安',
  EPI = '东风奕派',
  NAMMI = '东风纳米',
  FENGSHEN = '东风风神',
  FORTHING = '东风风行',
  MG = '上汽MG',
  ROEWE = '荣威',
  RISING = '飞凡',
  HAVAL = '哈弗',
  BUICK = '别克',
  CADILLAC = '凯迪拉克',
  TRUMPCHI = '广汽传祺',
  BAOJUN = '宝骏',
  CHERY = '奇瑞',
  FULWIN = '奇瑞风云',
  JMEV = '江铃新能源',
  ICAR = 'iCAR',
  HONGQI = '红旗',
  WEY = '魏牌',
  LIVAN = '睿蓝',
  CAOCAO = '曹操汽车',
  BMW = '宝马',
  BENZ = '奔驰',
  VW = '大众',
  AUDI = '奥迪',
  VOLVO = '沃尔沃'
}

export enum CarType {
  SEDAN = '轿车',
  SUV = 'SUV',
  MPV = 'MPV',
  WAGON = '旅行车',
  COUPE = '跑车/轿跑',
  OFFROAD = '越野车'
}

export enum PowerType {
  BEV = '纯电',
  REEV = '增程',
  PHEV = '插混'
}

export interface CarModel {
  id: string;
  brand: Brand;
  name: string;
  priceRange: [number, number]; // In Ten Thousand RMB
  range: number; // CLTC km
  sales: number; // Monthly Sales
  type: CarType;
  power: PowerType;
  features: string[];
  imageUrl: string;
  acceleration: number;
  autonomousLevel: 'L2' | 'L2+' | 'High-Speed NOA' | 'City NOA';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface QuizQuestion {
    id: string;
    text: string;
    description?: string;
    options: { label: string; value: string; icon?: string }[];
}