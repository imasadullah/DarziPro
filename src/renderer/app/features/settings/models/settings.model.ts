// ── Settings Model ────────────────────────────────────────────────────────────

export interface ShopInfoForm {
  shopName:     string;
  ownerName:    string;
  shopPhone:    string;
  shopWhatsApp: string;
  shopEmail:    string;
  shopAddress:  string;
  shopCity:     string;
  shopLogoPath: string;
}

export interface AppConfigForm {
  currencySymbol:      string;
  currencyPosition:    'prefix' | 'suffix';
  dateFormat:          'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
  defaultDeliveryDays: number;
}

export interface ReceiptSettingsForm {
  receiptHeader:      string;
  footerMessage:      string;
  receiptShowLogo:    boolean;
  receiptShowAddress: boolean;
  receiptShowPhone:   boolean;
}

/** Complete settings map as stored in DB (all string values) */
export interface AppSettingsMap {
  shopName:            string;
  ownerName:           string;
  shopPhone:           string;
  shopWhatsApp:        string;
  shopEmail:           string;
  shopAddress:         string;
  shopCity:            string;
  shopLogoPath:        string;
  currencySymbol:      string;
  currencyPosition:    string;
  dateFormat:          string;
  defaultDeliveryDays: string;
  receiptHeader:       string;
  footerMessage:       string;
  receiptShowLogo:     string;
  receiptShowAddress:  string;
  receiptShowPhone:    string;
  [key: string]:       string;
}

// ── Conversion Helpers ────────────────────────────────────────────────────────

export function mapToShopInfo(map: AppSettingsMap): ShopInfoForm {
  return {
    shopName:     map['shopName']     ?? '',
    ownerName:    map['ownerName']    ?? '',
    shopPhone:    map['shopPhone']    ?? '',
    shopWhatsApp: map['shopWhatsApp'] ?? '',
    shopEmail:    map['shopEmail']    ?? '',
    shopAddress:  map['shopAddress']  ?? '',
    shopCity:     map['shopCity']     ?? '',
    shopLogoPath: map['shopLogoPath'] ?? ''
  };
}

export function shopInfoToMap(form: ShopInfoForm): Record<string, string> {
  return {
    shopName:     form.shopName,
    ownerName:    form.ownerName,
    shopPhone:    form.shopPhone,
    shopWhatsApp: form.shopWhatsApp,
    shopEmail:    form.shopEmail,
    shopAddress:  form.shopAddress,
    shopCity:     form.shopCity,
    shopLogoPath: form.shopLogoPath
  };
}

export function mapToAppConfig(map: AppSettingsMap): AppConfigForm {
  return {
    currencySymbol:      map['currencySymbol']      ?? 'Rs',
    currencyPosition:    (map['currencyPosition']   ?? 'prefix') as 'prefix' | 'suffix',
    dateFormat:          (map['dateFormat']         ?? 'DD/MM/YYYY') as AppConfigForm['dateFormat'],
    defaultDeliveryDays: parseInt(map['defaultDeliveryDays'] ?? '7', 10)
  };
}

export function appConfigToMap(form: AppConfigForm): Record<string, string> {
  return {
    currencySymbol:      form.currencySymbol,
    currencyPosition:    form.currencyPosition,
    dateFormat:          form.dateFormat,
    defaultDeliveryDays: String(form.defaultDeliveryDays)
  };
}

export function mapToReceiptSettings(map: AppSettingsMap): ReceiptSettingsForm {
  return {
    receiptHeader:      map['receiptHeader']      ?? '',
    footerMessage:      map['footerMessage']      ?? 'Thank you for your business!',
    receiptShowLogo:    map['receiptShowLogo']    !== 'false',
    receiptShowAddress: map['receiptShowAddress'] !== 'false',
    receiptShowPhone:   map['receiptShowPhone']   !== 'false'
  };
}

export function receiptSettingsToMap(form: ReceiptSettingsForm): Record<string, string> {
  return {
    receiptHeader:      form.receiptHeader,
    footerMessage:      form.footerMessage,
    receiptShowLogo:    String(form.receiptShowLogo),
    receiptShowAddress: String(form.receiptShowAddress),
    receiptShowPhone:   String(form.receiptShowPhone)
  };
}
