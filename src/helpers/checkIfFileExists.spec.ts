/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';

import { checkIfFileExists } from './checkIfFileExists';

const FAKE_FILE_PATH = './fake/file/path.json';

describe('checkIfFileExists', () => {
  const fsStatSpy = jest.spyOn(fs, 'stat');

  describe('when file exists already', () => {
    let fsStatMock;
    let exists;

    beforeAll(() => {
      fsStatMock = fsStatSpy.mockImplementation((path, cb: any) =>
        cb(null, { path }),
      );
    });

    beforeEach(async () => {
      exists = await checkIfFileExists(FAKE_FILE_PATH);
    });

    it('returns true', () => {
      expect(exists).toBe(true);
    });

    it('correctly calls fs.stat with the filepath', () => {
      expect(fsStatMock).toBeCalledWith(FAKE_FILE_PATH, expect.anything());
    });
  });

  describe('when file does not exist', () => {
    let fsStatMock;
    let exists;

    beforeAll(() => {
      fsStatMock = fsStatSpy.mockImplementation((_path, cb: any) =>
        cb({ code: 'ENOENT' }),
      );
    });

    beforeEach(async () => {
      exists = await checkIfFileExists(FAKE_FILE_PATH);
    });

    it('returns false', () => {
      expect(exists).toBe(false);
    });

    it('correctly calls fs.stat with the filepath', () => {
      expect(fsStatMock).toBeCalledWith(FAKE_FILE_PATH, expect.anything());
    });
  });
});
