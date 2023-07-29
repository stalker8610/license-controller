import { LicenseController, LicenseReadStatuses } from '../dist/index.js';
import path from 'path';
import fs from 'fs';

const key = 'someKey';
const serverName = 'someServerName';
const orgName = 'someOrgName';
const appName = 'someAppName';

let instance;
const nullLicenseData = {
    licenseCount: 0,
    finishDate: null
}

const mockLicenseData = {
    licenseCount: 5,
    finishDate: new Date()
}

const expectedLicPath = path.join(process.env.ProgramData, orgName, appName, serverName, 'lic.key');

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

beforeAll(() => {
    instance = new LicenseController(serverName, orgName, appName, key);
});

beforeEach(() => {
    //clear path
    const pathToClear = path.join(process.env.ProgramData, orgName);
    try {
        fs.rmSync(pathToClear, { recursive: true });
    } catch (e) {
        //no such file
    }
});

afterAll(() => {
    //clear path
    const pathToClear = path.join(process.env.ProgramData, orgName);
    fs.rmSync(pathToClear, { recursive: true });
});


test('constructor creates new instance', () => {
    expect(instance).toBeInstanceOf(LicenseController);
});

test('constructor creates correct path to lic file', () => {

    expect(instance.licPath).toBe(expectedLicPath);
});

test('getLicenseCount returns 0 license count if not initialized', () => {
    expect(instance.getLicenseCount()).toBe(0);
});

test('getFinishDate returns null if not initialized', () => {
    expect(instance.getFinishDate()).toBeNull();
});

test('isLicenseActive returns false if not initialized', () => {
    expect(instance.isLicenseActive()).toBe(false);
});

test('isLicenseActive returns true if finishDate set and in the future', async () => {
    await instance.save({ ...mockLicenseData, finishDate: addDays(mockLicenseData.finishDate, 10) });
    expect(instance.isLicenseActive()).toBe(true);
});

test('isLicenseActive returns false if finishDate set and in the past', async () => {
    await instance.save({ ...mockLicenseData, finishDate: addDays(mockLicenseData.finishDate, -10) });
    expect(instance.isLicenseActive()).toBe(false);
});

test('readLicenseData returns correct data if initialized', async () => {
    await instance.save(mockLicenseData);
    const result = await instance.readLicenseData();
    expect(result).toBe(LicenseReadStatuses["SUCCESS"]);
    expect(instance.getLicenseCount()).toBe(mockLicenseData.licenseCount);
    expect(instance.getFinishDate()).toEqual(mockLicenseData.finishDate);
});

test('readLicenseData returns FILE_NOT_FOUND status if was not initialized', async () => {
    const result = await instance.readLicenseData();
    expect(result).toBe(LicenseReadStatuses["FILE_NOT_FOUND"]);
    expect(instance.licenseData).toEqual(nullLicenseData);
});

test('readLicenseData returns FILE_CORRUPTED status if file is corrupted', async () => {
    await instance.save(mockLicenseData);
    fs.writeFileSync(expectedLicPath, 'abcd'); //corrupt file
    const result = await instance.readLicenseData();
    expect(result).toBe(LicenseReadStatuses["FILE_CORRUPTED"]);
    expect(instance.licenseData).toEqual(nullLicenseData);
});

test('readLicenseData returns FILE_CORRUPTED status if file is empty', async () => {
    await instance.save(mockLicenseData);
    fs.writeFileSync(expectedLicPath, ''); //corrupt file
    const result = await instance.readLicenseData();
    expect(result).toBe(LicenseReadStatuses["FILE_CORRUPTED"]);
    expect(instance.licenseData).toEqual(nullLicenseData);
});
