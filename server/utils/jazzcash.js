import crypto from "crypto";

const DEFAULT_JAZZCASH_SANDBOX_URL =
  "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform";
const DEFAULT_JAZZCASH_PRODUCTION_URL =
  "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform";

const JAZZCASH_FIELD_ORDER = [
  "pp_Amount",
  "pp_BankID",
  "pp_BillReference",
  "pp_Description",
  "pp_DiscountBank",
  "pp_DiscountedAmount",
  "pp_Language",
  "pp_MerchantID",
  "pp_Password",
  "pp_ProductID",
  "pp_ReturnURL",
  "pp_SubMerchantID",
  "pp_TxnCurrency",
  "pp_TxnDateTime",
  "pp_TxnExpiryDateTime",
  "pp_TxnRefNo",
  "pp_TxnType",
  "pp_Version",
  "ppmpf_1",
  "ppmpf_2",
  "ppmpf_3",
  "ppmpf_4",
  "ppmpf_5",
];

const NON_HASH_FIELDS = new Set(["pp_SecureHash"]);

const pad = (value) => String(value).padStart(2, "0");

export const parseJazzCashDateTime = (value) => {
  if (!value) return null;

  const normalized = String(value).trim();

  if (!/^\d{14}$/.test(normalized)) {
    return null;
  }

  const year = Number(normalized.slice(0, 4));
  const month = Number(normalized.slice(4, 6));
  const day = Number(normalized.slice(6, 8));
  const hours = Number(normalized.slice(8, 10));
  const minutes = Number(normalized.slice(10, 12));
  const seconds = Number(normalized.slice(12, 14));

  const parsedDate = new Date(year, month - 1, day, hours, minutes, seconds);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day ||
    parsedDate.getHours() !== hours ||
    parsedDate.getMinutes() !== minutes ||
    parsedDate.getSeconds() !== seconds
  ) {
    return null;
  }

  return parsedDate;
};

export const formatJazzCashDateTime = (date = new Date()) => {
  const safeDate = date instanceof Date ? date : new Date(date);

  return [
    safeDate.getFullYear(),
    pad(safeDate.getMonth() + 1),
    pad(safeDate.getDate()),
    pad(safeDate.getHours()),
    pad(safeDate.getMinutes()),
    pad(safeDate.getSeconds()),
  ].join("");
};

export const addMinutesToJazzCashDateTime = (minutes, from = new Date()) => {
  const baseDate = from instanceof Date ? new Date(from) : new Date(from);
  baseDate.setMinutes(baseDate.getMinutes() + minutes);
  return formatJazzCashDateTime(baseDate);
};

export const generateJazzCashTxnRefNo = (prefix = "T") => {
  const now = new Date();
  const milliseconds = String(now.getMilliseconds()).padStart(3, "0");

  return `${prefix}${formatJazzCashDateTime(now)}${milliseconds}`;
};

export const sanitizeJazzCashText = (value, fallback = "") => {
  if (value === undefined || value === null) return fallback;

  return String(value)
    .replace(/[<>*=%/:'|"{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const normalizeJazzCashAmount = (amount) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("JazzCash amount must be a positive number.");
  }

  return String(Math.round(numericAmount * 100));
};

const isMeaningfulValue = (value) =>
  value !== undefined && value !== null && String(value) !== "";

export const buildJazzCashHashString = (payload, integritySalt) => {
  if (!integritySalt) {
    throw new Error("JazzCash integrity salt is required.");
  }

  const values = [];

  for (const field of JAZZCASH_FIELD_ORDER) {
    if (NON_HASH_FIELDS.has(field)) continue;

    const value = payload?.[field];
    if (isMeaningfulValue(value)) {
      values.push(String(value));
    }
  }

  return [integritySalt, ...values].join("&");
};

export const generateJazzCashSecureHash = (payload, integritySalt) => {
  const hashString = buildJazzCashHashString(payload, integritySalt);

  return crypto
    .createHmac("sha256", Buffer.from(String(integritySalt), "utf8"))
    .update(Buffer.from(hashString, "utf8"))
    .digest("hex");
};

export const verifyJazzCashSecureHash = (payload, integritySalt) => {
  const receivedHash = payload?.pp_SecureHash;

  if (!receivedHash || !integritySalt) return false;

  const expectedHash = generateJazzCashSecureHash(payload, integritySalt);

  return crypto.timingSafeEqual(
    Buffer.from(String(receivedHash).toLowerCase(), "utf8"),
    Buffer.from(String(expectedHash).toLowerCase(), "utf8"),
  );
};

export const getJazzCashCheckoutUrl = ({
  sandbox = true,
  sandboxUrl = DEFAULT_JAZZCASH_SANDBOX_URL,
  productionUrl = DEFAULT_JAZZCASH_PRODUCTION_URL,
} = {}) => (sandbox ? sandboxUrl : productionUrl);

export const buildJazzCashCheckoutPayload = ({
  merchantId,
  password,
  integritySalt,
  returnUrl,
  amount,
  billReference,
  description,
  txnRefNo,
  txnDateTime,
  txnExpiryDateTime,
  txnType = "MWALLET",
  version = "1.1",
  language = "EN",
  txnCurrency = "PKR",
  subMerchantId = "",
  bankId = "",
  productId = "",
  discountedAmount = "",
  discountBank = "",
  ppmpf1 = "",
  ppmpf2 = "",
  ppmpf3 = "",
  ppmpf4 = "",
  ppmpf5 = "",
} = {}) => {
  if (!merchantId) {
    throw new Error("JazzCash merchant ID is required.");
  }

  if (!password) {
    throw new Error("JazzCash password is required.");
  }

  if (!integritySalt) {
    throw new Error("JazzCash integrity salt is required.");
  }

  if (!returnUrl) {
    throw new Error("JazzCash return URL is required.");
  }

  const payload = {
    pp_Version: version,
    pp_TxnType: txnType,
    pp_Language: language,
    pp_MerchantID: merchantId,
    pp_SubMerchantID: subMerchantId,
    pp_Password: password,
    pp_BankID: bankId,
    pp_ProductID: productId,
    pp_TxnRefNo: txnRefNo || generateJazzCashTxnRefNo(),
    pp_Amount: normalizeJazzCashAmount(amount),
    pp_DiscountedAmount: discountedAmount,
    pp_DiscountBank: discountBank,
    pp_TxnCurrency: txnCurrency,
    pp_TxnDateTime: txnDateTime || formatJazzCashDateTime(),
    pp_TxnExpiryDateTime: txnExpiryDateTime || addMinutesToJazzCashDateTime(60),
    pp_BillReference: sanitizeJazzCashText(billReference || "billRef"),
    pp_Description: sanitizeJazzCashText(description || "Car rental booking"),
    pp_ReturnURL: returnUrl,
    ppmpf_1: ppmpf1,
    ppmpf_2: ppmpf2,
    ppmpf_3: ppmpf3,
    ppmpf_4: ppmpf4,
    ppmpf_5: ppmpf5,
  };

  payload.pp_SecureHash = generateJazzCashSecureHash(payload, integritySalt);

  return payload;
};

export const serializeJazzCashPayloadToInputs = (payload) =>
  Object.entries(payload)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([name, value]) => ({
      name,
      value: String(value),
    }));

export default {
  DEFAULT_JAZZCASH_SANDBOX_URL,
  DEFAULT_JAZZCASH_PRODUCTION_URL,
  JAZZCASH_FIELD_ORDER,
  parseJazzCashDateTime,
  formatJazzCashDateTime,
  addMinutesToJazzCashDateTime,
  generateJazzCashTxnRefNo,
  sanitizeJazzCashText,
  normalizeJazzCashAmount,
  buildJazzCashHashString,
  generateJazzCashSecureHash,
  verifyJazzCashSecureHash,
  getJazzCashCheckoutUrl,
  buildJazzCashCheckoutPayload,
  serializeJazzCashPayloadToInputs,
};
