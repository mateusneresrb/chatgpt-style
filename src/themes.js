async function getDirectoryEntry(directoryName) {
  return new Promise((resolve, reject) => {
    chrome.runtime.getPackageDirectoryEntry(directoryEntry => {
      if (directoryEntry) {
        directoryEntry.getDirectory(directoryName, {}, directoryEntry => {
          if (directoryEntry) {
            resolve(directoryEntry);
          } else {
            reject(new Error(`Failed to get directory entry for ${directoryName}`));
          }
        });
      } else {
        reject(new Error('Failed to get directory entry for extension.'));
      }
    });
  });
}

async function readDirectoryEntries(directoryEntry) {
  return new Promise((resolve, reject) => {
    directoryEntry.createReader().readEntries(entries => {
      const files = entries
        .filter(entry => entry.isFile && entry.name.endsWith('.css'))
        .map(entry => entry.name);

      resolve(files);
    }, error => {
      reject(new Error(`Failed to read directory entries: ${error}`));
    });
  });
}

async function readCssFile(directoryEntry, filename) {
  return new Promise((resolve, reject) => {
    directoryEntry.getFile(filename, {}, fileEntry => {
      fileEntry.file(file => {
        const reader = new FileReader();

        reader.onloadend = () => {
          const text = reader.result;

          const header = {};
          let styles = '';

          const headerEndIndex = text.indexOf('*/') - 2;
          const headerText = text.substring(2, headerEndIndex).trim();

          headerText.split('\n').forEach(line => {
            const colonIndex = line.indexOf(':');
            const key = line.substring(0, colonIndex).trim().toLowerCase();
            const value = line.substring(colonIndex + 1).trim();
            header[key] = value;
          });

          styles = text.substring(headerEndIndex + 1).trim();

          resolve({
            header,
            styles
          });
        };

        reader.onerror = () => {
          reject(new Error(`Failed to read file ${filename}`));
        };

        reader.readAsText(file);
      });
    }, error => {
      reject(new Error(`Failed to get file entry for ${filename}: ${error}`));
    });
  });
}

export default async function getThemes() {
  const themesDirectoryName = 'themes/';

  try {
    const themesDirectoryEntry = await getDirectoryEntry(themesDirectoryName);
    const cssFileNames = await readDirectoryEntries(themesDirectoryEntry);

    const cssFiles = cssFileNames.reduce(async (acc, filename) => {
      const result = await acc;
      try {
        const cssFile = await readCssFile(themesDirectoryEntry, filename);
        const data = {
          ...cssFile.header,
          styles: cssFile.styles
        };
        result.push({filename, data});
      } catch (error) {
        console.error(`Error loading CSS file ${filename}: ${error}`);
      }
      return result;
    }, []);

    return cssFiles;
  } catch (error) {
    console.error(`Error loading CSS files: ${error}`);
    return [];
  }
}
