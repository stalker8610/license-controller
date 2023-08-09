"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LicenseController = exports.LicenseReadStatuses = void 0;
const path_1 = __importDefault(require("path"));
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = require("fs");
var LicenseReadStatuses;
(function (LicenseReadStatuses) {
    LicenseReadStatuses[LicenseReadStatuses["SUCCESS"] = 0] = "SUCCESS";
    LicenseReadStatuses[LicenseReadStatuses["FILE_NOT_FOUND"] = -1] = "FILE_NOT_FOUND";
    LicenseReadStatuses[LicenseReadStatuses["FILE_CORRUPTED"] = -2] = "FILE_CORRUPTED";
})(LicenseReadStatuses || (exports.LicenseReadStatuses = LicenseReadStatuses = {}));
const nullLicenseData = {
    licenseCount: 0,
    finishDate: null
};
const licFileName = 'lic.key';
class LicenseController {
    constructor(serverName, devOrgName, appName, key) {
        this.serverName = serverName;
        this.devOrgName = devOrgName;
        this.appName = appName;
        this.key = key;
        this.licPath = '';
        this.licenseData = Object.assign({}, nullLicenseData);
        this.licPath = path_1.default.join(process.env.ProgramData, this.devOrgName, this.appName, this.serverName, licFileName);
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
                yield fs_1.promises.mkdir(this.licPath.replace(licFileName, ''), { recursive: true });
                return fs_1.promises.writeFile(this.licPath, encodedData);
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
                encodedData = yield fs_1.promises.readFile(this.licPath, { 'encoding': 'utf8' });
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
exports.LicenseController = LicenseController;
function encode(key, decodedData) {
    const resizedIV = Buffer.allocUnsafe(16);
    const iv = crypto_1.default.createHash('sha256').update('myHashedIV').digest();
    iv.copy(resizedIV);
    const hasedKey = crypto_1.default.createHash('sha256').update(key).digest();
    const cipher = crypto_1.default.createCipheriv('aes-256-cbc', hasedKey, resizedIV);
    const msg = [];
    msg.push(cipher.update(decodedData, 'binary', 'hex'));
    msg.push(cipher.final('hex'));
    return msg.join('');
}
function decode(key, encodedData) {
    const resizedIV = Buffer.allocUnsafe(16);
    const iv = crypto_1.default.createHash('sha256').update('myHashedIV').digest();
    iv.copy(resizedIV);
    const hasedKey = crypto_1.default.createHash('sha256').update(key).digest();
    const decipher = crypto_1.default.createDecipheriv('aes-256-cbc', hasedKey, resizedIV);
    const msg = [];
    msg.push(decipher.update(encodedData, 'hex', 'binary'));
    msg.push(decipher.final('binary'));
    return msg.join('');
}
