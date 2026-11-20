export type SupplierLocale = "en" | "zh" | "ko" | "ja" | "vi";

export interface SupplierLocaleOption {
  code: SupplierLocale;
  label: string;
  shortLabel: string;
}

export const SUPPLIER_LOCALES: readonly SupplierLocaleOption[] = [
  { code: "zh", label: "简体中文", shortLabel: "中文" },
  { code: "ko", label: "한국어", shortLabel: "한국어" },
  { code: "ja", label: "日本語", shortLabel: "日本語" },
  { code: "vi", label: "Tiếng Việt", shortLabel: "Tiếng Việt" },
  { code: "en", label: "English", shortLabel: "EN" },
] as const;

const VALID_SUPPLIER_LOCALE_SET = new Set<string>(
  SUPPLIER_LOCALES.map((item) => item.code),
);

export function isValidSupplierLocale(value: unknown): value is SupplierLocale {
  return typeof value === "string" && VALID_SUPPLIER_LOCALE_SET.has(value);
}

export function normalizeSupplierLocale(value: unknown): SupplierLocale {
  return isValidSupplierLocale(value) ? value : "zh";
}

export function getSupplierLocaleLabel(locale: SupplierLocale): string {
  return (
    SUPPLIER_LOCALES.find((item) => item.code === locale)?.label ?? "English"
  );
}

export interface SupplierFieldLocalizedMeta {
  label: string;
  hint?: string;
}

export type SupplierFieldZhMeta = SupplierFieldLocalizedMeta;

/**
 * Manufacturing-grade Simplified Chinese (简体中文) dictionary for all 50 static
 * EU Battery Regulation Annex XIII fields + additional_information.
 */
export const SUPPLIER_FIELD_ZH: Readonly<
  Record<string, SupplierFieldLocalizedMeta>
> = {
  unique_identifier: {
    label: "电池唯一识别码 (ISO/IEC 15459 URI)",
    hint: "请填写符合 ISO/IEC 15459 或 GS1 标准的电池识别编码（英文/数字）",
  },
  registering_entity_identity: {
    label: "护照注册责任主体信息",
    hint: "欧盟进口商或品牌方注册主体名称/编号",
  },
  manufacturer_name: {
    label: "制造商名称 / 商标",
    hint: "请使用英文填写正式企业名称或商标，例如 Shenzhen PowerCell Co., Ltd.",
  },
  manufacturer_postal_address: {
    label: "制造商注册地址",
    hint: "请用英文填写街道、城市、邮编与国家",
  },
  manufacturer_contact_digital: {
    label: "制造商官网与联系邮箱",
    hint: "例如 https://... 或 engineering@...",
  },
  battery_category: {
    label: "电池类别",
    hint: "请填写 LMT（轻型交通工具/电动自行车）、EV（电动汽车）或 industrial（工业电池 >2kWh）",
  },
  model_serial_number: {
    label: "电池型号 / 批次号 / 序列号",
    hint: "请填写英文/数字型号或生产批次编码",
  },
  place_of_manufacture: {
    label: "电池生产地点（城市、省/州、国家）",
    hint: "例如 Dongguan, Guangdong, China",
  },
  date_of_manufacturing: {
    label: "生产日期 (YYYY-MM)",
    hint: "例如 2026-11",
  },
  weight_kg: {
    label: "电池总重量 (kg)",
    hint: "请仅填写以千克 (kg) 为单位的数字，例如 3.2",
  },
  capacity_ah: {
    label: "额定容量 (Ah)",
    hint: "请填写以安时 (Ah) 为单位的数值，例如 14.5",
  },
  chemistry_type: {
    label: "电芯化学体系",
    hint: "请用英文简称填写，例如 Li-ion NMC 811 / LFP / NCA",
  },
  hazardous_substances_other: {
    label: "其他有害物质说明（不含汞/镉/铅，质量分数 >0.1%）",
    hint: "请用英文说明电解液或组件中含量 >0.1% w/w 的有害化学物质（若无可填 None declared）",
  },
  extinguishing_agent: {
    label: "适用灭火介质",
    hint: "例如 Water mist, ABC dry powder, CO2",
  },
  critical_raw_materials: {
    label: "关键原材料清单（质量分数 >0.1%）",
    hint: "请用英文列出含钴、锂、镍、天然石墨等材料，例如 Cobalt, Lithium, Nickel, Natural Graphite",
  },
  material_composition_summary: {
    label: "材料成分汇总说明",
    hint: "简要列出电芯及外壳主要材料成分",
  },
  carbon_footprint_declaration: {
    label: "碳足迹声明数值 (kg CO2e/kWh)",
    hint: "若已完成全生命周期碳足迹核算，请填写数值（否则可留空）",
  },
  carbon_footprint_label: {
    label: "碳足迹性能等级",
    hint: "待欧盟配套法案生效后填写",
  },
  due_diligence_report: {
    label: "负责任采购尽职调查报告编号/链接",
    hint: "2027年8月18日生效；若已有请填写文档编号或URL",
  },
  recovered_cobalt_percent: {
    label: "再生钴占比 (%)",
    hint: "仅填写百分比数字，例如 16",
  },
  recovered_lithium_percent: {
    label: "再生锂占比 (%)",
    hint: "仅填写百分比数字，例如 6",
  },
  recovered_nickel_percent: {
    label: "再生镍占比 (%)",
    hint: "仅填写百分比数字，例如 6",
  },
  recovered_lead_percent: {
    label: "再生铅占比 (%)",
    hint: "若不含铅请填 0",
  },
  renewable_content_share: {
    label: "可再生材料占比 (%)",
    hint: "仅填写百分比数字，例如 0",
  },
  rated_capacity_duplicate: {
    label: "标称容量复核值 (Ah)",
    hint: "与第11项一致的安时数值",
  },
  minimal_voltage_v: {
    label: "最低截止电压 (V)",
    hint: "请填写伏特 (V) 数值，例如 30.0",
  },
  nominal_voltage_v: {
    label: "标称电压 (V)",
    hint: "请填写伏特 (V) 数值，例如 36.0 或 48.0",
  },
  maximum_voltage_v: {
    label: "最高充电电压 (V)",
    hint: "请填写伏特 (V) 数值，例如 42.0 或 54.6",
  },
  original_power_w: {
    label: "原始额定功率能力 (W)",
    hint: "请填写瓦特 (W) 数值，例如 500",
  },
  power_limits_w: {
    label: "功率限值及对应温度范围 (W / °C)",
    hint: "例如 Max 750 W at 25 °C; 350 W at -10 °C",
  },
  expected_lifetime_cycles: {
    label: "预期循环寿命（次）",
    hint: "请填写标准测试下的充放电循环次数，例如 800",
  },
  expected_lifetime_test_ref: {
    label: "循环寿命参考测试标准",
    hint: "例如 IEC 61960-3 / EN 50604-1",
  },
  exhaustion_capacity_threshold: {
    label: "寿命终止容量阈值 (%)",
    hint: "EV 电池必填，通常为 80",
  },
  temperature_range_c: {
    label: "允许存储/工作温度范围 (°C)",
    hint: "例如 -20 °C to +60 °C (storage), 0 °C to +45 °C (charge)",
  },
  commercial_warranty_period: {
    label: "商业质保期限（月）",
    hint: "请填写月数，例如 24",
  },
  initial_rte_percent: {
    label: "初始往返能量效率 (%)",
    hint: "仅填写百分比数字，例如 94.5",
  },
  midlife_rte_percent: {
    label: "50% 寿命时往返能量效率 (%)",
    hint: "仅填写百分比数字，例如 91.0",
  },
  internal_resistance_ohms: {
    label: "单体电芯与电池包内阻 (Ω)",
    hint: "例如 Cell: 0.018 Ω / Pack: 0.085 Ω",
  },
  charge_c_rate: {
    label: "循环寿命测试充电倍率 (C)",
    hint: "例如 0.5",
  },
  discharge_c_rate: {
    label: "放电倍率 (C)",
    hint: "例如 1.0",
  },
  art_13_4_marking: {
    label: "欧盟第13(4)条分类回收标识说明",
    hint: "例如 Crossed-out wheeled bin symbol on casing label",
  },
  cd_pb_symbol: {
    label: "镉 (Cd) 或铅 (Pb) 化学符号标识",
    hint: "仅当 Cd > 0.002% 或 Pb > 0.004% 时填写，否则留空",
  },
  eu_doc_link: {
    label: "欧盟符合性声明 (EU DoC) 文件编号或链接",
    hint: "请填写英文编号或 URL",
  },
  waste_battery_info: {
    label: "废旧电池分类收集与回收说明",
    hint: "请用英文填写用户端安全回收与退回指引",
  },
  instructions_printable: {
    label: "可打印使用说明书链接/编号",
    hint: "如有 PDF 说明书链接请填写",
  },
  detailed_composition: {
    label: "正极 / 负极 / 电解液详细配方（受限访问层级）",
    hint: "仅对具备合法权益的维修/回收方可见，不会在公开扫码页展示",
  },
  spare_parts_info: {
    label: "备件料号及供应商联系方式（受限访问层级）",
    hint: "列出保险丝、锁扣、BMS 板件料号及备件联系邮箱",
  },
  dismantling_information: {
    label: "电池包拆解步骤、工具要求与爆炸图说明（受限访问层级）",
    hint: "仅对专业维修/拆解机构可见，请用英文简要描述紧固件与安全拆解顺序",
  },
  safety_measures: {
    label: "拆解作业安全防护措施（受限访问层级）",
    hint: "例如防电弧手套、绝缘工具、放电至 <30% SoC 要求",
  },
  compliance_test_reports: {
    label: "安全与性能测试报告编号（UN38.3 / IEC 62133 / EN 50604 等）",
    hint: "仅监管机构层级可见，请填写报告编号并可在下方上传 PDF 报告",
  },
  additional_information: {
    label: "补充工程备注（仅内部留档，不公开）",
    hint: "可补充未涵盖的规格书备注、电芯批次号或扭矩参数",
  },
};

/**
 * Manufacturing-grade Korean (한국어), Japanese (日本語), and Vietnamese (Tiếng Việt)
 * static Annex XIII field labels + concise input hints.
 * Tuple order: [koLabel, koHint, jaLabel, jaHint, viLabel, viHint]
 */
const SUPPLIER_FIELDS_KO_JA_VI: Readonly<
  Record<string, readonly [string, string, string, string, string, string]>
> = {
  unique_identifier: [
    "배터리 고유 식별자 (ISO/IEC 15459 URI)",
    "ISO/IEC 15459 또는 GS1 형식 영문/숫자 코드 입력",
    "バッテリー固有識別子 (ISO/IEC 15459 URI)",
    "ISO/IEC 15459 または GS1 準拠の英数字コードを入力",
    "Mã định danh duy nhất của pin (ISO/IEC 15459 URI)",
    "Nhập mã định danh theo chuẩn ISO/IEC 15459 hoặc GS1 (tiếng Anh/số)",
  ],
  registering_entity_identity: [
    "여권 등록 주체 정보",
    "EU 수입사 또는 브랜드 법인명/식별자",
    "パスポート登録事業者情報",
    "EU輸入者またはブランド法人の正式名称・識別子",
    "Đơn vị đăng ký hộ chiếu pin",
    "Tên pháp nhân hoặc mã định danh đơn vị nhập khẩu/thương hiệu tại EU",
  ],
  manufacturer_name: [
    "제조사명 / 상표",
    "공식 영문 회사명 입력 (예: Seoul CellTech Co., Ltd.)",
    "製造者名 / 商標",
    "正式な英語法人名を入力（例: Tokyo Energy Pack Co., Ltd.）",
    "Tên nhà sản xuất / Nhãn hiệu",
    "Nhập tên công ty chính thức bằng tiếng Anh (VD: VinBattery Pack Co., Ltd.)",
  ],
  manufacturer_postal_address: [
    "제조사 우편 주소",
    "영문 도로명, 도시, 우편번호, 국가 입력",
    "製造者所在地（住所）",
    "英語で番地・市区町村・郵便番号・国名を入力",
    "Địa chỉ bưu chính nhà sản xuất",
    "Nhập số nhà, đường, thành phố, mã bưu điện và quốc gia bằng tiếng Anh",
  ],
  manufacturer_contact_digital: [
    "제조사 웹사이트 및 이메일",
    "예: https://... 또는 engineering@...",
    "製造者ウェブサイト・連絡先メール",
    "例: https://... または engineering@...",
    "Website & email liên hệ nhà sản xuất",
    "VD: https://... hoặc engineering@...",
  ],
  battery_category: [
    "배터리 분류 (카테고리)",
    "LMT, EV, 또는 industrial 중 영문 코드 입력",
    "バッテリー区分（カテゴリー）",
    "LMT、EV、または industrial の英語コードを入力",
    "Phân loại pin",
    "Nhập mã tiếng Anh: LMT, EV, hoặc industrial",
  ],
  model_serial_number: [
    "모델명 / 배치 번호 / 일련번호",
    "영문/숫자 모델명 또는 생산 로트 번호 입력",
    "モデル名 / ロット番号 / シリアル番号",
    "英数字の型番または製造ロット番号を入力",
    "Mã model / Số lô / Số sê-ri",
    "Nhập mã model hoặc số lô sản xuất bằng chữ/số",
  ],
  place_of_manufacture: [
    "제조 장소 (도시, 지역, 국가)",
    "영문 표기 (예: Cheonan, Chungnam, South Korea)",
    "製造場所（都市・地域・国）",
    "英語表記（例: Osaka, Japan）",
    "Nơi sản xuất (Thành phố, Tỉnh, Quốc gia)",
    "Viết bằng tiếng Anh (VD: Bac Ninh, Vietnam)",
  ],
  date_of_manufacturing: [
    "제조 연월 (YYYY-MM)",
    "예: 2026-11",
    "製造年月 (YYYY-MM)",
    "例: 2026-11",
    "Tháng/năm sản xuất (YYYY-MM)",
    "VD: 2026-11",
  ],
  weight_kg: [
    "배터리 총 중량 (kg)",
    "kg 단위 숫자만 입력 (예: 3.2)",
    "バッテリー総重量 (kg)",
    "kg 単位の数値のみ入力（例: 3.2）",
    "Tổng khối lượng pin (kg)",
    "Chỉ nhập số theo đơn vị kg (VD: 3.2)",
  ],
  capacity_ah: [
    "정격 용량 (Ah)",
    "Ah 단위 숫자 입력 (예: 14.5)",
    "定格容量 (Ah)",
    "Ah 単位の数値を入力（例: 14.5）",
    "Dung lượng định mức (Ah)",
    "Nhập giá trị số theo đơn vị Ah (VD: 14.5)",
  ],
  chemistry_type: [
    "셀 화학 조성",
    "영문 약어 입력 (예: Li-ion NMC 811 / LFP / NCA)",
    "セル化学組成",
    "英語略称で入力（例: Li-ion NMC 811 / LFP / NCA）",
    "Hệ hóa học cell pin",
    "Nhập ký hiệu tiếng Anh (VD: Li-ion NMC 811 / LFP / NCA)",
  ],
  hazardous_substances_other: [
    "기타 유해물질 (Hg/Cd/Pb 제외, >0.1% w/w)",
    "0.1% w/w 초과 유해물질 영문 기재 (없으면 None declared)",
    "その他有害物質（Hg/Cd/Pb除く、0.1% w/w超）",
    "0.1% w/w超の含有物質を英語で記載（該当なしは None declared）",
    "Chất nguy hại khác (trừ Hg/Cd/Pb, >0.1% w/w)",
    "Ghi bằng tiếng Anh các chất >0.1% w/w (nếu không có ghi None declared)",
  ],
  extinguishing_agent: [
    "사용 가능한 소화 약제",
    "예: Water mist, ABC dry powder, CO2",
    "適用消火剤",
    "例: Water mist, ABC dry powder, CO2",
    "Chất chữa cháy phù hợp",
    "VD: Water mist, ABC dry powder, CO2",
  ],
  critical_raw_materials: [
    "핵심 원자재 (>0.1% w/w)",
    "영문 표기 (예: Cobalt, Lithium, Nickel, Natural Graphite)",
    "重要原材料（0.1% w/w超）",
    "英語表記（例: Cobalt, Lithium, Nickel, Natural Graphite）",
    "Nguyên liệu thô thiết yếu (>0.1% w/w)",
    "Liệt kê bằng tiếng Anh (VD: Cobalt, Lithium, Nickel, Natural Graphite)",
  ],
  material_composition_summary: [
    "재료 구성 요약",
    "셀 및 하우징 주요 재질 영문 요약",
    "材料構成サマリー",
    "セルおよび筐体の主要材料を英語で簡潔に記載",
    "Tóm tắt thành phần vật liệu",
    "Tóm tắt vật liệu chính của cell và vỏ pin bằng tiếng Anh",
  ],
  carbon_footprint_declaration: [
    "탄소 발자국 선언치 (kg CO2e/kWh)",
    "산정 완료 시 수치 입력 (미산정 시 공란)",
    "カーボンフットプリント宣言値 (kg CO2e/kWh)",
    "算定済みの場合は数値を入力（未算定は空欄可）",
    "Khai báo dấu chân carbon (kg CO2e/kWh)",
    "Nhập số liệu nếu đã tính toán (có thể để trống nếu chưa có)",
  ],
  carbon_footprint_label: [
    "탄소 발자국 성능 등급",
    "EU 하위 법령 시행 후 입력",
    "カーボンフットプリント性能クラス",
    "EU委任法令施行後に入力",
    "Hạng hiệu suất dấu chân carbon",
    "Điền sau khi EU ban hành văn bản hướng dẫn",
  ],
  due_diligence_report: [
    "책임 있는 공급망 실사 보고서 참조",
    "2027년 8월 18일 적용; 보유 시 문서 번호/URL 입력",
    "責任ある調達デューデリジェンス報告書参照",
    "2027年8月18日適用；該当文書番号またはURLを入力",
    "Báo cáo thẩm định chuỗi cung ứng có trách nhiệm",
    "Áp dụng từ 18/08/2027; nhập mã tài liệu hoặc URL nếu có",
  ],
  recovered_cobalt_percent: [
    "재활용 코발트 비율 (%)",
    "퍼센트 숫자만 입력 (예: 16)",
    "リサイクルコバルト比率 (%)",
    "数値のみ入力（例: 16）",
    "Tỷ lệ Coban tái chế (%)",
    "Chỉ nhập số phần trăm (VD: 16)",
  ],
  recovered_lithium_percent: [
    "재활용 리튬 비율 (%)",
    "퍼센트 숫자만 입력 (예: 6)",
    "リサイクルリチウム比率 (%)",
    "数値のみ入力（例: 6）",
    "Tỷ lệ Liti tái chế (%)",
    "Chỉ nhập số phần trăm (VD: 6)",
  ],
  recovered_nickel_percent: [
    "재활용 니켈 비율 (%)",
    "퍼센트 숫자만 입력 (예: 6)",
    "リサイクルニッケル比率 (%)",
    "数値のみ入力（例: 6）",
    "Tỷ lệ Niken tái chế (%)",
    "Chỉ nhập số phần trăm (VD: 6)",
  ],
  recovered_lead_percent: [
    "재활용 납 비율 (%)",
    "납 미함유 시 0 입력",
    "リサイクル鉛比率 (%)",
    "鉛を含まない場合は 0 を入力",
    "Tỷ lệ Chì tái chế (%)",
    "Nhập 0 nếu không chứa chì",
  ],
  renewable_content_share: [
    "재생 가능 원료 비율 (%)",
    "퍼센트 숫자만 입력 (예: 0)",
    "再生可能材料比率 (%)",
    "数値のみ入力（例: 0）",
    "Tỷ lệ vật liệu tái tạo (%)",
    "Chỉ nhập số phần trăm (VD: 0)",
  ],
  rated_capacity_duplicate: [
    "정격 용량 확인값 (Ah)",
    "11번 항목과 동일한 Ah 값",
    "定格容量（確認用）(Ah)",
    "項目11と同じ Ah 数値を入力",
    "Dung lượng định mức kiểm tra lại (Ah)",
    "Giá trị Ah trùng với mục số 11",
  ],
  minimal_voltage_v: [
    "최소 종지 전압 (V)",
    "V 단위 숫자 입력 (예: 30.0)",
    "最小電圧（終止電圧）(V)",
    "V 単位の数値を入力（例: 30.0）",
    "Điện áp tối thiểu (V)",
    "Nhập giá trị số theo đơn vị V (VD: 30.0)",
  ],
  nominal_voltage_v: [
    "공칭 전압 (V)",
    "V 단위 숫자 입력 (예: 36.0 또는 48.0)",
    "公称電圧 (V)",
    "V 単位の数値を入力（例: 36.0 または 48.0）",
    "Điện áp danh định (V)",
    "Nhập giá trị số theo đơn vị V (VD: 36.0 hoặc 48.0)",
  ],
  maximum_voltage_v: [
    "최대 충전 전압 (V)",
    "V 단위 숫자 입력 (예: 42.0 또는 54.6)",
    "最大電圧（満充電電圧）(V)",
    "V 単位の数値を入力（例: 42.0 または 54.6）",
    "Điện áp tối đa (V)",
    "Nhập giá trị số theo đơn vị V (VD: 42.0 hoặc 54.6)",
  ],
  original_power_w: [
    "초기 정격 출력 (W)",
    "W 단위 숫자 입력 (예: 500)",
    "初期出力能力 (W)",
    "W 単位の数値を入力（例: 500）",
    "Công suất ban đầu (W)",
    "Nhập giá trị số theo đơn vị W (VD: 500)",
  ],
  power_limits_w: [
    "온도별 출력 한계 (W / °C)",
    "예: Max 750 W at 25 °C; 350 W at -10 °C",
    "出力制限および温度範囲 (W / °C)",
    "例: Max 750 W at 25 °C; 350 W at -10 °C",
    "Giới hạn công suất theo nhiệt độ (W / °C)",
    "VD: Max 750 W at 25 °C; 350 W at -10 °C",
  ],
  expected_lifetime_cycles: [
    "예상 충·방전 사이클 수명 (회)",
    "숫자만 입력 (예: 800)",
    "想定サイクル寿命（回）",
    "標準試験での充放電サイクル数（例: 800）",
    "Tuổi thọ chu kỳ dự kiến (chu kỳ)",
    "Nhập số chu kỳ sạc/xả tiêu chuẩn (VD: 800)",
  ],
  expected_lifetime_test_ref: [
    "수명 기준 시험 규격",
    "예: IEC 61960-3 / EN 50604-1",
    "サイクル寿命参照試験規格",
    "例: IEC 61960-3 / EN 50604-1",
    "Tiêu chuẩn thử nghiệm tuổi thọ chu kỳ",
    "VD: IEC 61960-3 / EN 50604-1",
  ],
  exhaustion_capacity_threshold: [
    "수명 종료 용량 기준 (%)",
    "EV 배터리 필수 (통상 80)",
    "寿命終了容量しきい値 (%)",
    "EVバッテリー必須（通常 80）",
    "Ngưỡng dung lượng hết tuổi thọ (%)",
    "Bắt buộc cho pin EV (thường là 80)",
  ],
  temperature_range_c: [
    "허용 보관/작동 온도 범위 (°C)",
    "예: -20 °C to +60 °C (storage), 0 °C to +45 °C (charge)",
    "許容保管・動作温度範囲 (°C)",
    "例: -20 °C to +60 °C (storage), 0 °C to +45 °C (charge)",
    "Dải nhiệt độ lưu trữ / vận hành (°C)",
    "VD: -20 °C to +60 °C (storage), 0 °C to +45 °C (charge)",
  ],
  commercial_warranty_period: [
    "상업적 보증 기간 (개월)",
    "개월 수 숫자 입력 (예: 24)",
    "商業保証期間（か月）",
    "月数を数値で入力（例: 24）",
    "Thời hạn bảo hành thương mại (tháng)",
    "Nhập số tháng bảo hành (VD: 24)",
  ],
  initial_rte_percent: [
    "초기 왕복 에너지 효율 (%)",
    "퍼센트 숫자 입력 (예: 94.5)",
    "初期往復エネルギー効率 (%)",
    "数値のみ入力（例: 94.5）",
    "Hiệu suất năng lượng khứ hồi ban đầu (%)",
    "Chỉ nhập số phần trăm (VD: 94.5)",
  ],
  midlife_rte_percent: [
    "수명 50% 시점 왕복 에너지 효율 (%)",
    "퍼센트 숫자 입력 (예: 91.0)",
    "寿命50%時の往復エネルギー効率 (%)",
    "数値のみ入力（例: 91.0）",
    "Hiệu suất năng lượng khứ hồi tại 50% tuổi thọ (%)",
    "Chỉ nhập số phần trăm (VD: 91.0)",
  ],
  internal_resistance_ohms: [
    "셀 및 팩 내부 저항 (Ω)",
    "예: Cell: 0.018 Ω / Pack: 0.085 Ω",
    "セルおよびパック内部抵抗 (Ω)",
    "例: Cell: 0.018 Ω / Pack: 0.085 Ω",
    "Nội trở cell và bộ pin (Ω)",
    "VD: Cell: 0.018 Ω / Pack: 0.085 Ω",
  ],
  charge_c_rate: [
    "수명 시험 충전 C-rate (C)",
    "예: 0.5",
    "サイクル寿命試験 充電Cレート (C)",
    "例: 0.5",
    "Tốc độ sạc C-rate trong thử nghiệm chu kỳ (C)",
    "VD: 0.5",
  ],
  discharge_c_rate: [
    "방전 C-rate (C)",
    "예: 1.0",
    "放電Cレート (C)",
    "例: 1.0",
    "Tốc độ xả C-rate (C)",
    "VD: 1.0",
  ],
  art_13_4_marking: [
    "EU 제13(4)조 분리수거 표기 설명",
    "예: Crossed-out wheeled bin symbol on casing label",
    "EU第13(4)条 分別回収マーク表示",
    "例: Crossed-out wheeled bin symbol on casing label",
    "Ký hiệu thu gom riêng theo Điều 13(4)",
    "VD: Crossed-out wheeled bin symbol on casing label",
  ],
  cd_pb_symbol: [
    "카드뮴(Cd) 또는 납(Pb) 화학 기호",
    "Cd > 0.002% 또는 Pb > 0.004%인 경우에만 기재",
    "カドミウム(Cd) / 鉛(Pb) 化学記号表示",
    "Cd > 0.002% または Pb > 0.004% の場合のみ記載",
    "Ký hiệu hóa học Cadimi (Cd) hoặc Chì (Pb)",
    "Chỉ điền khi Cd > 0.002% hoặc Pb > 0.004%",
  ],
  eu_doc_link: [
    "EU 적합성 선언서 (EU DoC) 번호 또는 URL",
    "영문 문서 번호 또는 URL 입력",
    "EU適合宣言書 (EU DoC) 番号またはURL",
    "英語文書番号またはURLを入力",
    "Mã tài liệu / URL Tuyên bố hợp chuẩn EU (EU DoC)",
    "Nhập mã tài liệu tiếng Anh hoặc URL",
  ],
  waste_battery_info: [
    "폐배터리 분리배출 및 재활용 안내",
    "소비자용 안전 배출·회수 지침 영문 기재",
    "使用済みバッテリー分別回収・リサイクル案内",
    "エンドユーザー向け回収・廃棄手順を英語で記載",
    "Hướng dẫn thu gom và tái chế pin thải",
    "Nhập hướng dẫn thu gom, trả pin an toàn bằng tiếng Anh",
  ],
  instructions_printable: [
    "인쇄 가능한 사용 설명서 링크/번호",
    "PDF 설명서 링크 보유 시 입력",
    "印刷可能な取扱説明書リンク・番号",
    "PDFマニュアルURLがある場合に入力",
    "Liên kết / mã tài liệu hướng dẫn sử dụng in được",
    "Nhập URL tài liệu hướng dẫn PDF nếu có",
  ],
  detailed_composition: [
    "양극/음극/전해액 상세 조성 (제한 접근 등급)",
    "공인 수리·재활용 업체 전용 정보 (일반 공개 QR 미노출)",
    "正極・負極・電解液の詳細組成（限定公開）",
    "認可修理・リサイクル業者向けのみ（一般QRには非表示）",
    "Thành phần chi tiết cực dương / cực âm / điện phân (Giới hạn)",
    "Chỉ dành cho đơn vị sửa chữa/tái chế (không hiển thị trên trang QR công khai)",
  ],
  spare_parts_info: [
    "예비 부품 번호 및 공급처 연락처 (제한 접근 등급)",
    "퓨즈, 래치, BMS 보드 부품번호 및 담당 이메일",
    "交換部品番号・供給元連絡先（限定公開）",
    "ヒューズ、ラッチ、BMS基板品番および連絡先メール",
    "Mã phụ tùng thay thế & liên hệ nhà cung cấp (Giới hạn)",
    "Liệt kê mã cầu chì, chốt khóa, mạch BMS và email liên hệ",
  ],
  dismantling_information: [
    "분해 절차, 공구 요구사항 및 분해도 정보 (제한 접근 등급)",
    "전문 수리·해체 작업자용 영문 설명 기재",
    "分解手順・必要工具・分解図情報（限定公開）",
    "専門修理・解体業者向けに英語で記載",
    "Thông tin tháo dỡ, dụng cụ & sơ đồ tách lớp (Giới hạn)",
    "Mô tả trình tự tháo an toàn bằng tiếng Anh cho kỹ thuật viên",
  ],
  safety_measures: [
    "해체 시 작업 안전 수칙 (제한 접근 등급)",
    "예: 절연 장갑, 절연 공구, SoC <30% 방전 기준",
    "解体作業時の安全対策（限定公開）",
    "例: 絶縁手袋、絶縁工具、SoC 30%未満への放電手順",
    "Biện pháp an toàn khi tháo dỡ (Giới hạn)",
    "VD: Găng tay cách điện, dụng cụ cách điện, xả pin về <30% SoC",
  ],
  compliance_test_reports: [
    "안전·성능 시험 성적서 번호 (UN38.3 / IEC 62133 / EN 50604 등)",
    "규제 당국 전용 등급; 성적서 번호 입력 및 하단 PDF 첨부 가능",
    "安全・性能試験報告書番号（UN38.3 / IEC 62133 / EN 50604 等）",
    "監督当局向け非公開項目；番号入力および下記PDF添付が可能",
    "Mã báo cáo thử nghiệm an toàn & hiệu năng (UN38.3 / IEC 62133 / EN 50604)",
    "Chỉ dành cho cơ quan quản lý; điền mã báo cáo và đính kèm PDF bên dưới",
  ],
  additional_information: [
    "추가 엔지니어링 메모 (내부 보관 전용, 비공개)",
    "셀 로트, 체결 토크 등 추가 사양 메모",
    "補足エンジニアリングメモ（社内保管用・非公開）",
    "セルロット番号や締付トルク等の補足仕様",
    "Ghi chú kỹ thuật bổ sung (Nội bộ, không công khai)",
    "Ghi chú thêm về lô cell, lực siết hoặc thông số datasheet khác",
  ],
};

export function getSupplierFieldMeta(
  fieldKey: string,
  locale: SupplierLocale,
): SupplierFieldLocalizedMeta | null {
  if (locale === "en") return null;
  if (locale === "zh") {
    return SUPPLIER_FIELD_ZH[fieldKey] ?? null;
  }
  const tuple = SUPPLIER_FIELDS_KO_JA_VI[fieldKey];
  if (!tuple) return null;
  if (locale === "ko") return { label: tuple[0], hint: tuple[1] };
  if (locale === "ja") return { label: tuple[2], hint: tuple[3] };
  return { label: tuple[4], hint: tuple[5] };
}

export interface SupplierPortalCopySet {
  badge: string;
  title: string;
  subtitle: string;
  siUnitReminder: string;
  requestedBy: string;
  expiresLabel: string;
  noLoginNote: string;
  factoryNameLabel: string;
  factoryNamePlaceholder: string;
  fieldsHeading: string;
  uploadHeading: string;
  uploadSubheading: string;
  uploadPickLabel: string;
  uploadLimitNote: string;
  submitButton: string;
  submittingButton: string;
  successTitle: string;
  successBody: string;
  expiredTitle: string;
  expiredBody: string;
  revokedTitle: string;
  revokedBody: string;
  alreadySubmittedTitle: string;
  alreadySubmittedBody: string;
  notFoundTitle: string;
  notFoundBody: string;
  disclaimer: string;
  errorEmpty: string;
  errorFileSize: string;
  errorFileType: string;
  tierPublic: string;
  tierLegitimate: string;
  tierAuthorities: string;
}

export const SUPPLIER_PORTAL_COPY: Record<
  SupplierLocale,
  SupplierPortalCopySet
> = {
  en: {
    badge: "No-Login Factory Data Portal · CratePass",
    title: "Battery Specification Data Request",
    subtitle:
      "Submit missing EU Battery Regulation (EU) 2023/1542 Annex XIII technical values directly for review. No account creation is required.",
    siUnitReminder:
      "Please enter standardized values in English and SI units (V, Ah, W, kg, Ω, °C, %).",
    requestedBy: "Battery product",
    expiresLabel: "Link expires",
    noLoginNote: "Secure single-request link · Zero signup required",
    factoryNameLabel: "Factory / Engineer Name (optional)",
    factoryNamePlaceholder: "e.g. Shenzhen CellTech Engineering",
    fieldsHeading: "Requested technical specifications",
    uploadHeading: "Attach supporting spec sheet or test report PDF (optional)",
    uploadSubheading:
      "Upload OEM cell/pack datasheet, UN38.3 transport summary, or IEC 62133 / EN 50604 test PDF (max 10 MB).",
    uploadPickLabel: "Choose PDF file",
    uploadLimitNote:
      "Stored privately in the buyer's workspace bucket. Restricted tiers never appear on public consumer QR pages.",
    submitButton: "Submit specifications for buyer review",
    submittingButton: "Submitting data...",
    successTitle: "Specifications submitted",
    successBody:
      "Thank you. Your technical entries and any uploaded PDF have been delivered to the buyer's workspace for side-by-side review before publishing.",
    expiredTitle: "This supplier request link has expired",
    expiredBody:
      "Supplier data links expire after 14 days for security. Ask your EU buyer to generate a fresh CratePass link.",
    revokedTitle: "This supplier request link was revoked",
    revokedBody:
      "The workspace owner revoked this link. Please contact your buyer if you still need to share updated specifications.",
    alreadySubmittedTitle: "Data has already been submitted",
    alreadySubmittedBody:
      "This request link was already completed and sent to the buyer's review queue.",
    notFoundTitle: "Supplier request link not found",
    notFoundBody:
      "Check that you copied the full URL from your buyer, or request a new magic link.",
    disclaimer:
      "Working field list — check against official regulation. Submitted data is reviewed and declared by the economic operator; not verified by CratePass.",
    errorEmpty:
      "Enter at least one specification value or attach a PDF document before submitting.",
    errorFileSize: "PDF exceeds the 10 MB file size limit.",
    errorFileType: "Only .pdf files are supported.",
    tierPublic: "Public QR",
    tierLegitimate: "Repairers / Recyclers only",
    tierAuthorities: "Authorities only (Private)",
  },
  zh: {
    badge: "免登录工厂数据填报通道 · CratePass",
    title: "欧盟电池护照技术参数填报单",
    subtitle:
      "请直接填写欧盟《电池法规 (EU) 2023/1542》附件 XIII 所需的缺失技术参数，提交后将自动发送给欧盟品牌方审核。全程无需注册账号或登录。",
    siUnitReminder:
      "温馨提示：所有参数请尽量使用英文及国际标准单位（V、Ah、W、kg、Ω、°C、%）填写，便于直接合并至欧盟护照草稿。",
    requestedBy: "对应电池产品",
    expiresLabel: "链接有效期至",
    noLoginNote: "加密一次性填报链接 · 无需注册登录",
    factoryNameLabel: "工厂 / 填报工程师名称（选填）",
    factoryNamePlaceholder: "例如 Shenzhen CellTech / Engineer Wang",
    fieldsHeading: "需要补充的静态技术参数",
    uploadHeading: "上传规格书或测试报告 PDF（选填）",
    uploadSubheading:
      "支持上传电芯/电池包规格书、UN38.3 运输报告、IEC 62133 或 EN 50604 测试报告 PDF（最大 10 MB）。",
    uploadPickLabel: "选择 PDF 文件",
    uploadLimitNote:
      "文件仅保存于品牌方私有加密存储空间。受限层级与测试报告绝不会在公开扫码页向消费者展示。",
    submitButton: "提交技术参数供品牌方审核",
    submittingButton: "正在提交数据...",
    successTitle: "技术参数已成功提交",
    successBody:
      "感谢配合！您填写的参数及附件 PDF 已安全发送至品牌方后台，品牌方将在核对差异并确认后合并至正式护照草稿。",
    expiredTitle: "该填报链接已过期",
    expiredBody:
      "为保障数据安全，供应商免登录链接有效期为 14 天。请联系您的欧盟客户重新生成新的填报链接。",
    revokedTitle: "该填报链接已被撤销",
    revokedBody:
      "品牌方管理员已停用此链接。如需继续补充数据，请联系对方发送新链接。",
    alreadySubmittedTitle: "该填报单已完成提交",
    alreadySubmittedBody:
      "此链接对应的参数已提交并进入品牌方审核队列，无需重复提交。",
    notFoundTitle: "未找到对应的填报链接",
    notFoundBody:
      "请核对链接是否完整复制，或联系您的客户获取新的 CratePass 供应商填报链接。",
    disclaimer:
      "参考字段清单 — 请以欧盟官方电池法规原文为准。数据由经济运营商审核并声明负责，CratePass 不提供合规认证或背书。",
    errorEmpty: "请至少填写一项技术参数或上传一份 PDF 文档后再提交。",
    errorFileSize: "PDF 文件大小超过 10 MB 限制。",
    errorFileType: "仅支持上传 .pdf 格式文件。",
    tierPublic: "公开扫码可见",
    tierLegitimate: "仅维修/回收机构可见",
    tierAuthorities: "仅监管机构可见（保密）",
  },
  ko: {
    badge: "무로그인 공장 데이터 입력 포털 · CratePass",
    title: "EU 배터리 여권 기술 사양 입력 요청서",
    subtitle:
      "EU 배터리 규정 (EU) 2023/1542 부속서 XIII의 누락된 정적 기술 항목을 입력해 주세요. 회원가입이나 로그인 없이 바로 제출할 수 있습니다.",
    siUnitReminder:
      "안내: 바이어 검토 및 여권 초안 병합을 위해 모든 값은 영문과 국제 표준 단위(V, Ah, W, kg, Ω, °C, %)로 입력해 주세요.",
    requestedBy: "대상 배터리 제품",
    expiresLabel: "링크 만료일",
    noLoginNote: "보안 일회성 입력 링크 · 회원가입 불필요",
    factoryNameLabel: "제조 공장 / 담당 엔지니어명 (선택)",
    factoryNamePlaceholder: "예: Seoul CellTech / Engineer Kim",
    fieldsHeading: "요청된 정적 기술 사양",
    uploadHeading: "사양서 또는 시험 성적서 PDF 첨부 (선택)",
    uploadSubheading:
      "셀/팩 데이터시트, UN38.3 운송 요약서, IEC 62133 또는 EN 50604 시험 성적서 PDF 업로드 (최대 10 MB).",
    uploadPickLabel: "PDF 파일 선택",
    uploadLimitNote:
      "업로드된 파일은 바이어 전용 비공개 저장소에 안전하게 보관되며, 제한 등급 정보는 일반 소비자 QR 페이지에 표시되지 않습니다.",
    submitButton: "바이어 검토용 기술 사양 제출",
    submittingButton: "데이터 제출 중...",
    successTitle: "기술 사양이 제출되었습니다",
    successBody:
      "감사합니다. 입력하신 사양과 첨부 PDF가 바이어 워크스페이스로 안전하게 전달되었으며, 바이어 검토 후 초안에 반영됩니다.",
    expiredTitle: "이 공급사 입력 링크는 만료되었습니다",
    expiredBody:
      "보안을 위해 공급사 링크는 14일 후 만료됩니다. EU 바이어에게 새 CratePass 링크 발급을 요청해 주세요.",
    revokedTitle: "이 공급사 입력 링크는 철회되었습니다",
    revokedBody:
      "워크스페이스 관리자가 링크를 비활성화했습니다. 추가 제출이 필요하면 바이어에게 문의해 주세요.",
    alreadySubmittedTitle: "이미 제출이 완료된 요청서입니다",
    alreadySubmittedBody:
      "이 링크의 사양 데이터는 이미 제출되어 바이어 검토 대기열에 전달되었습니다.",
    notFoundTitle: "공급사 요청 링크를 찾을 수 없습니다",
    notFoundBody:
      "바이어로부터 전달받은 전체 URL을 확인하거나 새 링크를 요청해 주세요.",
    disclaimer:
      "작업용 항목 목록 — 공식 EU 배터리 규정 원문을 확인하시기 바랍니다. 제출된 데이터는 경제 사업자가 검토 및 선언하며 CratePass가 검증하지 않습니다.",
    errorEmpty: "제출하기 전에 최소 한 개 이상의 사양 값을 입력하거나 PDF를 첨부해 주세요.",
    errorFileSize: "PDF 파일 크기가 10 MB 제한을 초과했습니다.",
    errorFileType: ".pdf 파일만 업로드할 수 있습니다.",
    tierPublic: "공개 QR 표시",
    tierLegitimate: "수리·재활용 업체 전용",
    tierAuthorities: "규제 당국 전용 (비공개)",
  },
  ja: {
    badge: "ログイン不要 サプライヤー入力ポータル · CratePass",
    title: "EUバッテリーパスポート技術仕様データ入力フォーム",
    subtitle:
      "EUバッテリー規則 (EU) 2023/1542 附属書 XIII に基づく不足仕様をご入力ください。アカウント登録やログインは一切不要です。",
    siUnitReminder:
      "ご注意：バイヤー側の下書きへ統合するため、入力値は可能な限り英語およびSI単位（V、Ah、W、kg、Ω、°C、%）でご記入ください。",
    requestedBy: "対象バッテリー製品",
    expiresLabel: "リンク有効期限",
    noLoginNote: "暗号化専用リンク · アカウント登録不要",
    factoryNameLabel: "工場名 / ご担当者名（任意）",
    factoryNamePlaceholder: "例: Osaka Pack Mfg / Engineer Sato",
    fieldsHeading: "ご入力いただきたい静的技術仕様",
    uploadHeading: "仕様書・試験報告書PDFの添付（任意）",
    uploadSubheading:
      "セル/パック仕様書、UN38.3輸送試験要約、IEC 62133 / EN 50604 試験報告書PDFを添付できます（最大 10 MB）。",
    uploadPickLabel: "PDFファイルを選択",
    uploadLimitNote:
      "添付PDFはバイヤー専用の非公開ストレージに保管されます。限定公開項目や試験報告書が一般向けQRページに表示されることはありません。",
    submitButton: "バイヤー確認用に仕様データを送信",
    submittingButton: "送信中...",
    successTitle: "技術仕様データを送信しました",
    successBody:
      "ご協力ありがとうございます。ご入力いただいた仕様および添付PDFはバイヤーのワークスペースへ安全に送信されました。",
    expiredTitle: "この入力リンクは有効期限が切れています",
    expiredBody:
      "セキュリティ保護のため、サプライヤー入力リンクは14日間で失効します。EUバイヤーに新しいリンクの発行をご依頼ください。",
    revokedTitle: "この入力リンクは無効化されました",
    revokedBody:
      "バイヤー側の管理者によりリンクが取り消されました。追加入力が必要な場合は担当者へご連絡ください。",
    alreadySubmittedTitle: "このリクエストはすでに送信済みです",
    alreadySubmittedBody:
      "ご入力いただいた仕様データは既にバイヤーの確認キューへ送信されています。",
    notFoundTitle: "サプライヤー入力リンクが見つかりません",
    notFoundBody:
      "URLが途中で切れていないかご確認のうえ、必要に応じてバイヤーへ新しいリンクをご依頼ください。",
    disclaimer:
      "作業用フィールド一覧 — 公式のEU規則原文をご確認ください。入力内容は経済事業者が確認・宣言するものであり、CratePassによる審査・保証は行いません。",
    errorEmpty: "少なくとも1つの仕様項目を入力するか、PDFファイルを添付してから送信してください。",
    errorFileSize: "PDFファイルが 10 MB の上限を超えています。",
    errorFileType: ".pdf ファイルのみアップロード可能です。",
    tierPublic: "一般QR公開",
    tierLegitimate: "修理・リサイクル業者限定",
    tierAuthorities: "監督当局限定（非公開）",
  },
  vi: {
    badge: "Cổng nhập liệu nhà cung cấp không cần đăng nhập · CratePass",
    title: "Phiếu cung cấp thông số kỹ thuật Hộ chiếu Pin EU",
    subtitle:
      "Vui lòng điền các thông số kỹ thuật còn thiếu theo Phụ lục XIII Quy định Pin EU (EU) 2023/1542 để đối tác châu Âu rà soát. Không cần tạo tài khoản hay đăng nhập.",
    siUnitReminder:
      "Lưu ý: Vui lòng nhập giá trị chuẩn hóa bằng tiếng Anh và đơn vị SI (V, Ah, W, kg, Ω, °C, %) để hợp nhất trực tiếp vào bản nháp hộ chiếu.",
    requestedBy: "Sản phẩm pin",
    expiresLabel: "Liên kết hết hạn vào",
    noLoginNote: "Liên kết bảo mật một lần · Không cần đăng ký",
    factoryNameLabel: "Tên nhà máy / Kỹ sư phụ trách (tùy chọn)",
    factoryNamePlaceholder: "VD: Bac Ninh Pack Assembly / Engineer Nguyen",
    fieldsHeading: "Thông số kỹ thuật tĩnh được yêu cầu",
    uploadHeading: "Đính kèm datasheet hoặc báo cáo thử nghiệm PDF (tùy chọn)",
    uploadSubheading:
      "Tải lên datasheet cell/pack, tóm tắt vận chuyển UN38.3 hoặc báo cáo IEC 62133 / EN 50604 dạng PDF (tối đa 10 MB).",
    uploadPickLabel: "Chọn tệp PDF",
    uploadLimitNote:
      "Tệp được lưu riêng tư trong kho lưu trữ của bên mua. Các mục giới hạn và báo cáo thử nghiệm không bao giờ hiển thị công khai khi quét QR.",
    submitButton: "Gửi thông số để đối tác rà soát",
    submittingButton: "Đang gửi dữ liệu...",
    successTitle: "Đã gửi thông số kỹ thuật thành công",
    successBody:
      "Cảm ơn bạn. Dữ liệu kỹ thuật và tệp PDF đính kèm (nếu có) đã được chuyển an toàn tới không gian làm việc của bên mua để đối chiếu trước khi xuất bản.",
    expiredTitle: "Liên kết nhập liệu này đã hết hạn",
    expiredBody:
      "Để đảm bảo bảo mật, liên kết nhà cung cấp hết hạn sau 14 ngày. Vui lòng yêu cầu đối tác EU tạo liên kết CratePass mới.",
    revokedTitle: "Liên kết nhập liệu này đã bị thu hồi",
    revokedBody:
      "Chủ không gian làm việc đã vô hiệu hóa liên kết này. Vui lòng liên hệ bên mua nếu bạn cần gửi bổ sung thông số.",
    alreadySubmittedTitle: "Dữ liệu cho phiếu này đã được gửi",
    alreadySubmittedBody:
      "Liên kết này đã hoàn tất gửi thông số và đang nằm trong hàng chờ rà soát của bên mua.",
    notFoundTitle: "Không tìm thấy liên kết nhập liệu",
    notFoundBody:
      "Hãy kiểm tra lại bạn đã sao chép đầy đủ URL chưa, hoặc đề nghị đối tác gửi liên kết mới.",
    disclaimer:
      "Danh mục trường làm việc — cần đối chiếu với văn bản quy định chính thức của EU. Dữ liệu do đơn vị kinh tế rà soát và tự công bố; CratePass không thực hiện thẩm định hay bảo chứng.",
    errorEmpty:
      "Vui lòng điền ít nhất một thông số kỹ thuật hoặc đính kèm một tệp PDF trước khi gửi.",
    errorFileSize: "Tệp PDF vượt quá giới hạn 10 MB.",
    errorFileType: "Chỉ hỗ trợ định dạng tệp .pdf.",
    tierPublic: "Hiển thị QR công khai",
    tierLegitimate: "Chỉ thợ sửa chữa / tái chế",
    tierAuthorities: "Chỉ cơ quan quản lý (Riêng tư)",
  },
};
