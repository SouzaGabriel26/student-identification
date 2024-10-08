import { constants } from '@/utils/constants';
import crypto from 'crypto';
import { jwtVerify, SignJWT } from 'jose';
import { keccak256 } from 'js-sha3';

export type CryptographyService = typeof cryptography;

export const cryptography = Object.freeze({
  generateKeyPairs,
  encryptData,
  decryptData,
  generateToken,
  verifyToken,
  generateEthAddress,
});

type GenerateKeyPairsProps = {
  passphrase: string;
};

function generateKeyPairs({ passphrase }: GenerateKeyPairsProps) {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: 'aes-256-cbc',
      passphrase: passphrase,
    },
  });

  return { privateKey, publicKey };
}

type EncryptDataProps<T> = {
  data: T;
  publicKey: string;
};

function encryptData<Data>({ data, publicKey }: EncryptDataProps<Data>) {
  const stringifiedData = JSON.stringify(data);
  if (stringifiedData.length > 470) {
    return {
      error: 'O tamanho do objeto é muito grande para ser criptografado.',
    };
  }

  const bufferData = Buffer.from(JSON.stringify(data), 'utf8');
  const encryptedData = crypto.publicEncrypt(
    publicKey,
    new Uint8Array(bufferData),
  );
  return { encryptedData: encryptedData.toString('base64') };
}

export type DecryptDataProps = {
  encryptedData: string;
  privateKey: string;
  passphrase: string;
};

function decryptData<DecryptDataType = any>({
  encryptedData,
  privateKey,
  passphrase,
}: DecryptDataProps) {
  try {
    const bufferData = Buffer.from(encryptedData, 'base64');
    const decryptedData = crypto.privateDecrypt(
      { key: privateKey, passphrase },
      new Uint8Array(bufferData),
    );

    const parsedData = JSON.parse(
      decryptedData.toString('utf8'),
    ) as DecryptDataType;

    return {
      decryptedData: parsedData,
    };
  } catch {
    return {
      error: 'Credenciais inválidas.',
    };
  }
}

type GenerateTokenProps = {
  userId: string;
};

async function generateToken({ userId }: GenerateTokenProps) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({
      alg: 'HS256',
      typ: 'JWT',
    })
    .setExpirationTime('1d')
    .setIssuedAt()
    .sign(new TextEncoder().encode(constants.jwt_secret));

  return { token };
}

async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(constants.jwt_secret),
    );

    return payload;
  } catch {
    return {
      error: 'Token inválido ou expirado.',
    };
  }
}

function generateEthAddress(rsaPublicKey: string) {
  const sha256Hash = crypto.createHash('sha256').update(rsaPublicKey).digest();

  const keccakHash = keccak256(sha256Hash);

  const address = '0x' + keccakHash.slice(-40);

  return address;
}
