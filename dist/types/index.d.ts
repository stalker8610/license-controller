export type LicenseData = {
    licenseCount: number;
    finishDate: Date | null;
};
export declare enum LicenseReadStatuses {
    SUCCESS = 0,
    FILE_NOT_FOUND = -1,
    FILE_CORRUPTED = -2
}
export type LicenseDataReadResult = {
    status: LicenseReadStatuses;
    licenseData: LicenseData;
};
export declare class LicenseController {
    private readonly serverName;
    private readonly devOrgName;
    private readonly appName;
    private readonly key;
    private readonly licenseData;
    private readonly licPath;
    constructor(serverName: string, devOrgName: string, appName: string, key: string);
    getLicenseCount(): number;
    getFinishDate(): Date | null;
    isLicenseActive(): boolean;
    save(licenseData: LicenseData): Promise<any>;
    readLicenseData(): Promise<LicenseReadStatuses>;
    private readFile;
}
