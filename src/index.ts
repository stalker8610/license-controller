import * as path from 'path';
import * as crypto from 'crypto';
import { promises as fsPromises } from 'fs';

export type LicenseData = {
    licenseCount: number;
    finishDate: Date | null;
}

export enum LicenseReadStatuses {
    SUCCESS = 0,
    FILE_NOT_FOUND = -1,
    FILE_CORRUPTED = -2,
}

export type LicenseDataReadResult = {
    status: LicenseReadStatuses,
    licenseData: LicenseData
}

const nullLicenseData: LicenseData = {
    licenseCount: 0,
    finishDate: null
};

const licFileName = 'lic.key';

export class LicenseController {

    private readonly licenseData: LicenseData;
    private readonly licPath: string = '';

    constructor(private readonly serverName: string,
        private readonly devOrgName: string,
        private readonly appName: string,
        private readonly key: string) {

        this.licenseData = Object.assign({}, nullLicenseData);
        this.licPath = path.join(process.env.ProgramData as string, this.devOrgName, this.appName, this.serverName, licFileName);
    }

    getLicenseCount(): number {
        return this.licenseData.licenseCount;
    }

    getFinishDate(): Date | null {
        return this.licenseData.finishDate;
    }

    isLicenseActive(): boolean {
        return (this.licenseData.finishDate !== null && this.licenseData.finishDate > new Date());
    }

    async save(licenseData: LicenseData): Promise<any> {
        const prevLicenseData = Object.assign({}, this.licenseData);
        try {
            Object.assign(this.licenseData, licenseData);
            let serializedLicenseData = JSON.stringify(this.licenseData);
            let encodedData = encode(this.key, serializedLicenseData);
            await fsPromises.mkdir(this.licPath.replace(licFileName, ''), { recursive: true });
            return fsPromises.writeFile(this.licPath, encodedData);
        }
        catch (e) {
            Object.assign(this.licenseData, prevLicenseData);
            return Promise.reject(e);
        }
    }

    async readLicenseData(): Promise<LicenseReadStatuses> {
        const result = await this.readFile();
        Object.assign(this.licenseData, result.licenseData);
        return result.status;
    }

    private async readFile(): Promise<LicenseDataReadResult> {
        let encodedData: string;
        try {
            encodedData = await fsPromises.readFile(this.licPath, { 'encoding': 'utf8' });
            try {
                const decodedData = decode(this.key, encodedData);
                const parsedData = JSON.parse(decodedData);
                parsedData.finishDate = new Date(parsedData.finishDate);
                return {
                    status: LicenseReadStatuses.SUCCESS,
                    licenseData: parsedData
                }
            } catch (err) {
                return {
                    status: LicenseReadStatuses.FILE_CORRUPTED,
                    licenseData: Object.assign({}, nullLicenseData)
                }
            }
        } catch (err) {
            return {
                status: LicenseReadStatuses.FILE_NOT_FOUND,
                licenseData: Object.assign({}, nullLicenseData)
            }
        }
    }

}

function encode(key: string, decodedData: string): string {

    const resizedIV = Buffer.allocUnsafe(16);
    const iv = crypto.createHash('sha256').update('myHashedIV').digest();
    iv.copy(resizedIV);

    const hasedKey = crypto.createHash('sha256').update(key).digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', hasedKey, resizedIV);

    const msg: Array<string> = [];

    msg.push(cipher.update(decodedData, 'binary', 'hex'));
    msg.push(cipher.final('hex'));

    return msg.join('');

}

function decode(key: string, encodedData: string): string {

    const resizedIV = Buffer.allocUnsafe(16);
    const iv = crypto.createHash('sha256').update('myHashedIV').digest();
    iv.copy(resizedIV);

    const hasedKey = crypto.createHash('sha256').update(key).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', hasedKey, resizedIV);

    const msg: Array<string> = [];
    msg.push(decipher.update(encodedData, 'hex', 'binary'));
    msg.push(decipher.final('binary'));

    return msg.join('');

}


