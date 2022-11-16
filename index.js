const path = require('path');
const crypto = require('crypto');
const fsPromises = require('fs').promises;

class LicenseController {

    constructor(serverName, devOrgName, appName, key){
        this.serverName = serverName;
        this.key = key;
        this.devOrgName = devOrgName;
        this.appName = appName;
    }

    async initialize(licenseData){
        if (licenseData == undefined){
            return await this.read();
        }
        else{
            this.licenseCount = licenseData.licenseCount;
            this.finishDate = licenseData.finishDate;
            this.save();
        }
    }

    getLicPath() {
        return path.join(process.env.ProgramData, this.devOrgName, this.appName, this.serverName, 'lic.key');
    }

    getKey() {
        return this.key;
    }

    getLicenseCount(){
        return this.licenseCount;
    }

    getFinishDate(){
        return this.finishDate;
    }

    isLicenseActive(){
        return (this.finishDate!=undefined && this.finishDate > new Date());
    }

    save() {

        let data = JSON.stringify({ 'licenseCount': this.licenseCount, 'finishDate': this.finishDate });

        let licPath = this.getLicPath();
        let encodedData = this.encode(this.getKey(), data);

        try {
            fsPromises.writeFile(licPath, encodedData);
        }
        catch (err) {
            throw err;
        }
    }

    async read() {

        let licPath = this.getLicPath();

        let encodedData;
        try {
            encodedData = await fsPromises.readFile(licPath, { 'encoding': 'utf8' });
        }
        catch (err) {
            //file doesn't exist
            this.licenseCount = 0;
            this.finishDate = undefined;
            return -1;
        }

        if (encodedData !== undefined) {

            try {
                let decodedData = this.decode(this.getKey(), encodedData);
                let parsedData = JSON.parse(decodedData);

                this.licenseCount = parsedData.licenseCount;
                this.finishDate = parsedData.finishDate;
            }
            catch (err) {
                //license file is corrupted
                this.licenseCount = 0;
                this.finishDate = undefined;
                return -2;
            }

        }
        else {

            this.licenseCount = 0;
            this.finishDate = undefined;

        }

        return 0;

    }

    encode(key, decodedData) {

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

    decode(key, encodedData) {

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

}

module.exports = LicenseController;