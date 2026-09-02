/**
 * 字段级 AES-256-GCM 加密（ADR-006 / Spec 6.3）。
 *
 * 密文布局：[1B keyVersion][12B IV][密文][16B AuthTag]
 * keyVersion 为密钥轮换预留，V1 固定 0x01。
 *
 * 主密钥来源 process.env.DATA_ENCRYPTION_KEY（base64 编码的 32 字节）。
 * 生产由 KMS 凭据管家注入，明文密钥永不进入数据库进程，也不入代码库。
 */

import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_VERSION = 0x01;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

export class CryptoConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CryptoConfigError';
  }
}

export class DecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DecryptionError';
  }
}

let cachedKey: Buffer | null = null;
let cachedPepper: Buffer | null = null;

function loadKey(): Buffer {
  if (cachedKey) return cachedKey;
  const raw = process.env.DATA_ENCRYPTION_KEY;
  if (!raw) {
    throw new CryptoConfigError('DATA_ENCRYPTION_KEY 未配置，拒绝以明文写入敏感字段');
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== KEY_LENGTH) {
    throw new CryptoConfigError(
      `DATA_ENCRYPTION_KEY 长度必须为 32 字节，当前为 ${key.length} 字节`,
    );
  }
  cachedKey = key;
  return key;
}

function loadPepper(): Buffer {
  if (cachedPepper) return cachedPepper;
  const raw = process.env.CONTACT_HASH_PEPPER;
  if (!raw) {
    throw new CryptoConfigError('CONTACT_HASH_PEPPER 未配置，无法生成不可逆去重哈希');
  }
  const pepper = Buffer.from(raw, 'hex');
  if (pepper.length < 16) {
    throw new CryptoConfigError('CONTACT_HASH_PEPPER 至少需要 16 字节熵');
  }
  cachedPepper = pepper;
  return pepper;
}

/** 测试与密钥轮换后调用，清掉进程内缓存。 */
export function resetCryptoCache(): void {
  cachedKey = null;
  cachedPepper = null;
}

export function encryptToBuffer(plaintext: string): Buffer {
  const key = loadKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const body = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return Buffer.concat([Buffer.from([KEY_VERSION]), iv, body, cipher.getAuthTag()]);
}

export function decryptFromBuffer(payload: Buffer | Uint8Array): string {
  const buf = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  if (buf.length < 1 + IV_LENGTH + TAG_LENGTH) {
    throw new DecryptionError('密文长度不足，数据可能已损坏');
  }
  const version = buf[0];
  if (version !== KEY_VERSION) {
    throw new DecryptionError(`不支持的密钥版本 ${String(version)}`);
  }
  const iv = buf.subarray(1, 1 + IV_LENGTH);
  const tag = buf.subarray(buf.length - TAG_LENGTH);
  const body = buf.subarray(1 + IV_LENGTH, buf.length - TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, loadKey(), iv);
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8');
  } catch {
    throw new DecryptionError('密文校验失败，数据已被篡改或密钥不匹配');
  }
}

/** results.payload_enc 用 JSONB 存，结构 { v, iv, tag, data }（Spec 6.2.2）。 */
export interface EncryptedEnvelope {
  v: number;
  iv: string;
  tag: string;
  data: string;
}

export function encryptToEnvelope(plaintext: string): EncryptedEnvelope {
  const key = loadKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const body = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    v: KEY_VERSION,
    iv: iv.toString('base64'),
    tag: cipher.getAuthTag().toString('base64'),
    data: body.toString('base64'),
  };
}

export function decryptFromEnvelope(envelope: unknown): string {
  if (!isEncryptedEnvelope(envelope)) {
    throw new DecryptionError('密文信封结构不合法');
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    loadKey(),
    Buffer.from(envelope.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  try {
    const body = Buffer.from(envelope.data, 'base64');
    return Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8');
  } catch {
    throw new DecryptionError('密文校验失败，数据已被篡改或密钥不匹配');
  }
}

export function isEncryptedEnvelope(value: unknown): value is EncryptedEnvelope {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.v === 'number' &&
    typeof v.iv === 'string' &&
    typeof v.tag === 'string' &&
    typeof v.data === 'string'
  );
}

/** HMAC-SHA256(value, PEPPER)，用于手机号定位与留资去重，不可逆。 */
export function hmacHash(value: string): string {
  return createHmac('sha256', loadPepper()).update(value.trim()).digest('hex');
}

export function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
