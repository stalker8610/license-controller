var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import path from 'path';
import crypto from 'crypto';
import { promises as fsPromises } from 'fs';
export var LicenseReadStatuses;
(function (LicenseReadStatuses) {
    LicenseReadStatuses[LicenseReadStatuses["SUCCESS"] = 0] = "SUCCESS";
    LicenseReadStatuses[LicenseReadStatuses["FILE_NOT_FOUND"] = -1] = "FILE_NOT_FOUND";
    LicenseReadStatuses[LicenseReadStatuses["FILE_CORRUPTED"] = -2] = "FILE_CORRUPTED";
})(LicenseReadStatuses || (LicenseReadStatuses = {}));
const nullLicenseData = {
    licenseCount: 0,
    finishDate: null
};
const licFileName = 'lic.key';
export class LicenseController {
    constructor(serverName, devOrgName, appName, key) {
        this.serverName = serverName;
        this.devOrgName = devOrgName;
        this.appName = appName;
        this.key = key;
        this.licPath = '';
        this.licenseData = Object.assign({}, nullLicenseData);
        this.licPath = path.join(process.env.ProgramData, this.devOrgName, this.appName, this.serverName, licFileName);
    }
    getLicenseCount() {
        return this.licenseData.licenseCount;
    }
    getFinishDate() {
        return this.licenseData.finishDate;
    }
    isLicenseActive() {
        return (this.licenseData.finishDate !== null && this.licenseData.finishDate > new Date());
    }
    save(licenseData) {
        return __awaiter(this, void 0, void 0, function* () {
            const prevLicenseData = Object.assign({}, this.licenseData);
            try {
                Object.assign(this.licenseData, licenseData);
                let serializedLicenseData = JSON.stringify(this.licenseData);
                let encodedData = encode(this.key, serializedLicenseData);
                yield fsPromises.mkdir(this.licPath.replace(licFileName, ''), { recursive: true });
                return fsPromises.writeFile(this.licPath, encodedData);
            }
            catch (e) {
                Object.assign(this.licenseData, prevLicenseData);
                return Promise.reject(e);
            }
        });
    }
    readLicenseData() {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.readFile();
            Object.assign(this.licenseData, result.licenseData);
            return result.status;
        });
    }
    readFile() {
        return __awaiter(this, void 0, void 0, function* () {
            let encodedData;
            try {
                encodedData = yield fsPromises.readFile(this.licPath, { 'encoding': 'utf8' });
                try {
                    const decodedData = decode(this.key, encodedData);
                    const parsedData = JSON.parse(decodedData);
                    parsedData.finishDate = new Date(parsedData.finishDate);
                    return {
                        status: LicenseReadStatuses.SUCCESS,
                        licenseData: parsedData
                    };
                }
                catch (err) {
                    return {
                        status: LicenseReadStatuses.FILE_CORRUPTED,
                        licenseData: Object.assign({}, nullLicenseData)
                    };
                }
            }
            catch (err) {
                return {
                    status: LicenseReadStatuses.FILE_NOT_FOUND,
                    licenseData: Object.assign({}, nullLicenseData)
                };
            }
        });
    }
}
function encode(key, decodedData) {
    const resizedIV = Buffer.allocUnsafe(16);
    const iv = crypto.createHash('sha256').update('myHashedIV').digest();
    iv.copy(resizedIV);
    const hasedKey = crypto.createHash('sha256').update(key).digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', hasedKey, resizedIV);
    const msg = [];
    msg.push(cipher.update(decodedData, 'binary', 'hex'));
    msg.push(cipher.final('hex'));
    return msg.join('');
}
function decode(key, encodedData) {
    const resizedIV = Buffer.allocUnsafe(16);
    const iv = crypto.createHash('sha256').update('myHashedIV').digest();
    iv.copy(resizedIV);
    const hasedKey = crypto.createHash('sha256').update(key).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', hasedKey, resizedIV);
    const msg = [];
    msg.push(decipher.update(encodedData, 'hex', 'binary'));
    msg.push(decipher.final('binary'));
    return msg.join('');
}
