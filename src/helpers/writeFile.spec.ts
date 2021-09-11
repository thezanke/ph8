/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fs from 'fs';

import { writeFile } from './writeFile';

describe('writeFile', () => {
  it('correctly calls fs.stat with the filepath', async () => {
    const filePath = './fake/file/path.json';
    const fileString = 'FILE STRING';
    const writeFileMock = jest
      .spyOn(fs, 'writeFile')
      .mockImplementation((_path, _data, cb: any) => cb());

    await writeFile(filePath, fileString);

    expect(writeFileMock).toBeCalledWith(
      filePath,
      fileString,
      expect.anything(),
    );
  });
});
