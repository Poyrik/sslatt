import { CaptchaGenerator } from 'captcha-canvas';

import { saveRedisKey } from '@/lib/redis';

const isEmpty = (val: any) => {
  return (
    val === null ||
    val === undefined ||
    val === '' ||
    val === undefined ||
    val === null ||
    !val
  );
};
interface Captcha {
  text: string;
  data: string;
}

export const getCaptchaFromLocalhost = async (): Promise<Captcha> => {
  const captcha = new CaptchaGenerator();
  const captchaText = captcha.text;

  const capatchaBuffer = await captcha.generate();
  const imgStr = Buffer.from(capatchaBuffer).toString('base64');

  return {
    text: captchaText,
    data: imgStr,
  };
};

export const saveCaptchaToRedis = async (
  iv: string,
  captchaString: string,
): Promise<Boolean> => {
  try {
    await saveRedisKey(`captcha:${iv}`, captchaString, 60, false);
    return true;
  } catch (error) {
    console.log('saveCaptchaToRedis error', error);
    return false;
  }
};

function hex2ab(hexString: string): Uint8Array {
  // Convert the hexadecimal string back to a Uint8Array
  const uint8Array = new Uint8Array(hexString.length / 2);

  for (let i = 0; i < hexString.length; i += 2) {
    uint8Array[i / 2] = parseInt(hexString.substr(i, 2), 16);
  }
  return uint8Array;
}

let cachedKey: CryptoKey | undefined;
let cachedKeySecret: string | undefined;

/**
 * Derives the AES-GCM key with HKDF-SHA256 from ACCESS_TOKEN_SECRET.
 * A separate `info` label keeps this key independent from the JWT signing use
 * of the same secret. Throws if the secret is missing or too short.
 */
export const importKey = async () => {
  const secretEnv = process.env.ACCESS_TOKEN_SECRET || '';
  if (secretEnv.length < 32) {
    throw new Error('ACCESS_TOKEN_SECRET must be set and at least 32 chars');
  }

  if (cachedKey && cachedKeySecret === secretEnv) return cachedKey;

  const baseKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secretEnv),
    'HKDF',
    false,
    ['deriveKey'],
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('sslatt-captcha-salt-v1'),
      info: new TextEncoder().encode('sslatt-captcha-aes-gcm-v1'),
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );

  cachedKey = key;
  cachedKeySecret = secretEnv;
  return key;
};

export const decryptCaptchaCode = async (dataHex: any, ivHex: any) => {
  const secret = await importKey();
  const data = hex2ab(dataHex);
  const iv = hex2ab(ivHex);

  const decryptedCyphertext = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    secret,
    data,
  );

  const decoded = new TextDecoder().decode(decryptedCyphertext);
  return decoded;
};

export const encryptCaptchaCode = async (
  str: string,
): Promise<
  | {
      iv: string;
      data: string;
    }
  | undefined
  | null
> => {
  if (isEmpty(str)) {
    return undefined;
  }

  const data = new TextEncoder().encode(str);

  const secret = await importKey();
  const ivCyphertext = crypto.getRandomValues(new Uint8Array(12));
  const encryptedCyphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivCyphertext,
    },
    secret,
    data,
  );

  const encrypted = Array.from(new Uint8Array(Buffer.from(encryptedCyphertext)))
    .map((byte: any) => byte.toString(16).padStart(2, '0'))
    .join('');
  const iv = Array.from(ivCyphertext)
    .map((byte: any) => byte.toString(16).padStart(2, '0'))
    .join('');

  return {
    iv,
    data: encrypted,
  };
};
